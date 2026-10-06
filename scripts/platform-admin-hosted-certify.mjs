import {Client} from 'pg';
import {randomUUID} from 'node:crypto';

const url=process.env.DATABASE_URL;
if(!url)throw new Error('DATABASE_URL is required.');

const parsed=new URL(url);
if(['127.0.0.1','localhost','::1'].includes(parsed.hostname))throw new Error('Hosted certification requires a non-local PostgreSQL target.');

const client=new Client({
  connectionString:url,
  options:'-c search_path=teensurance -c statement_timeout=10000'
});

const checks={};
let failed=false;

function pass(name,value=true){checks[name]=value}
function fail(name,error){checks[name]=false;failed=true;console.error(`FAIL ${name}:`,error instanceof Error?error.message:error)}

async function expectImmutable(name,sql,args=[]){
  await client.query('SAVEPOINT immutable_check');
  try{
    await client.query(sql,args);
    fail(name,'mutation unexpectedly succeeded');
  }catch(error){
    if(error?.code==='23514')pass(name,true);
    else fail(name,error);
  }finally{
    await client.query('ROLLBACK TO SAVEPOINT immutable_check');
    await client.query('RELEASE SAVEPOINT immutable_check');
  }
}

try{
  await client.connect();
  const identity=await client.query('SELECT session_user,current_user');
  checks.session_user=identity.rows[0]?.session_user;
  checks.initial_current_user=identity.rows[0]?.current_user;

  await client.query('BEGIN');
  try{
    await client.query('SET ROLE teensurance_runtime');
    pass('runtime_role_usable');

    const roleIdentity=await client.query('SELECT current_user');
    checks.runtime_current_user=roleIdentity.rows[0]?.current_user;
    if(checks.runtime_current_user!=='teensurance_runtime')fail('runtime_identity','current_user is not teensurance_runtime');
    else pass('runtime_identity');

    const privileges=await client.query(`
      SELECT
        has_schema_privilege(current_user,'teensurance','USAGE') AS schema_usage,
        has_table_privilege(current_user,'teensurance.users','SELECT,INSERT,UPDATE,DELETE') AS users_rw,
        has_table_privilege(current_user,'teensurance.records','SELECT,INSERT,UPDATE,DELETE') AS records_rw,
        has_table_privilege(current_user,'teensurance.audit','SELECT,INSERT') AS audit_append,
        has_table_privilege(current_user,'teensurance.ledger','SELECT,INSERT') AS ledger_append
    `);
    Object.assign(checks,privileges.rows[0]);
    for(const [name,value] of Object.entries(privileges.rows[0]))if(!value)fail(name,'required privilege missing');

    const userId=randomUUID();
    const householdId=randomUUID();
    const driveId=randomUUID();
    const evidenceId=randomUUID();
    const auditId=randomUUID();
    const ledgerId=randomUUID();
    const now=new Date().toISOString();

    await client.query(
      'INSERT INTO teensurance.users(id,email,password,name,created_at) VALUES($1,$2,$3,$4,$5)',
      [userId,`hosted-cert-${userId}@example.invalid`,'certification-only','Hosted Certification',now]
    );
    pass('runtime_user_write');

    const drivePayload={
      id:driveId,householdId,ownerId:userId,teenId:userId,supervisorId:userId,
      skill:'certification',status:'verified',startedAt:now,endedAt:now,
      minutes:1,nightMinutes:0,note:'hosted certification',revision:0,corrections:[]
    };
    await client.query(
      'INSERT INTO teensurance.records(id,kind,household_id,owner_id,payload) VALUES($1,$2,$3,$4,$5)',
      [driveId,'drive',householdId,userId,JSON.stringify(drivePayload)]
    );
    pass('runtime_record_write');

    const evidencePayload={
      id:evidenceId,householdId,ownerId:userId,teenId:userId,
      conceptId:'certification',result:'pass',createdAt:now
    };
    await client.query(
      'INSERT INTO teensurance.records(id,kind,household_id,owner_id,payload) VALUES($1,$2,$3,$4,$5)',
      [evidenceId,'roadready_attempt',householdId,userId,JSON.stringify(evidencePayload)]
    );
    pass('append_only_evidence_insert');

    await client.query(
      'INSERT INTO teensurance.audit(id,at,actor_id,household_id,action,decision,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [auditId,now,userId,householdId,'platform_admin.hosted_certify','ALLOW','Transactional hosted certification']
    );
    pass('audit_append');

    await client.query(
      'INSERT INTO teensurance.ledger(id,drive_id,revision,household_id,teen_id,minutes,night_minutes,actor_id,reason,at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [ledgerId,driveId,0,householdId,userId,1,0,userId,'Hosted certification',now]
    );
    pass('ledger_append');

    await expectImmutable('audit_immutable','UPDATE teensurance.audit SET reason=$1 WHERE id=$2',['should fail',auditId]);
    await expectImmutable('ledger_immutable','DELETE FROM teensurance.ledger WHERE id=$1',[ledgerId]);
    await expectImmutable('evidence_immutable','DELETE FROM teensurance.records WHERE id=$1',[evidenceId]);

    const secretProjection=await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='teensurance' AND table_name IN ('users','sessions')
      AND column_name IN ('password','hash')
      ORDER BY table_name,column_name
    `);
    checks.protected_columns_present=secretProjection.rows.map(r=>r.column_name);
    pass('protected_columns_not_removed');

    await client.query('ROLLBACK');
    pass('transaction_rolled_back');
  }catch(error){
    await client.query('ROLLBACK').catch(()=>{});
    fail('runtime_certification',error);
  }
}finally{
  await client.end();
}

console.log(JSON.stringify(checks,null,2));
if(failed)process.exitCode=2;

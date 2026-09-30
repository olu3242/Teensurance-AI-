export type VehicleProfile={
 vin:string;make:string;model:string;modelYear?:number;bodyClass?:string;vehicleType?:string;
 plantCountry?:string;source:'NHTSA_VPIC';decodedAt:string;
};

type VpicResult={VIN?:string;Make?:string;Model?:string;ModelYear?:string;BodyClass?:string;VehicleType?:string;PlantCountry?:string;ErrorCode?:string;ErrorText?:string};
type VpicResponse={Results?:VpicResult[]};

export interface VehicleDecoder{decode(vin:string,modelYear?:number):Promise<VehicleProfile>}

export const nhtsaVpicDecoder:VehicleDecoder={
 async decode(vin,modelYear){
   const normalized=vin.trim().toUpperCase();
   if(!/^[A-HJ-NPR-Z0-9*]{8,17}$/.test(normalized))throw new Error('Enter a valid VIN or supported partial VIN.');
   const params=new URLSearchParams({format:'json'});if(modelYear)params.set('modelyear',String(modelYear));
   const response=await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(normalized)}?${params}`,{headers:{accept:'application/json'}});
   if(!response.ok)throw new Error('Vehicle decoder is temporarily unavailable.');
   const data=await response.json() as VpicResponse;const value=data.Results?.[0];
   if(!value||(!value.Make&&!value.Model))throw new Error(value?.ErrorText||'VIN could not be decoded.');
   return {vin:normalized,make:value.Make||'',model:value.Model||'',modelYear:Number(value.ModelYear)||modelYear,bodyClass:value.BodyClass||undefined,vehicleType:value.VehicleType||undefined,plantCountry:value.PlantCountry||undefined,source:'NHTSA_VPIC',decodedAt:new Date().toISOString()};
 }
};

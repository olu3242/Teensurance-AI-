# Landing page reference implementation

The supplied screenshot is the visual reference for `/`. The existing family pilot remains at `/pilot`. The landing page is responsive, with interactive story controls and a mobile navigation menu. Parent links select the existing parent pilot view; milestone links select the corresponding pilot step. Start drive opens the existing distraction-free driving screen. The landing-page timer and practice totals are illustrative, not live user data. Logging and verification continue through the existing pilot service.

## Shared visual system

`app/globals.css` defines the shared navy, lime, off-white, typography, focus, radius, and dark-surface tokens. Both the landing page and pilot use these tokens. Journey, logging, family review, notices, form controls, and distraction-free driving mode follow the same visual system. The pilot uses bold sans-serif headings, lime primary actions, navy supporting panels, and the geometric T mark. The mobile pilot keeps the driving-mode control available. These presentation changes do not alter domain rules or persisted practice data.

## Photography asset

Asset: `public/images/driving-stories.png`.

Generated with the built-in image-generation tool using the supplied screenshot as a visual reference. The scenes are recreated photographs, not the original source images. CSS shows the left and right halves as separate story cards.

Prompt: Create a photorealistic editorial diptych asset for a teen driving website, two equal-width portrait photographs side by side, no gap, total landscape aspect ratio 7:4. LEFT HALF: side profile of an 18-year-old young woman with brown hair in the driver's seat of a modern car, looking attentively forward, hands on steering wheel, seatbelt, warm evening light through window, camera from passenger seat, her head in upper left-middle of this half, steering wheel at right. RIGHT HALF: father in his forties with short brown hair wearing a navy overshirt and his 18-year-old son with curly dark hair wearing a charcoal jacket over grey hoodie, smiling gently and looking down toward car beside them, car hood across bottom, sunset parking lot trees background. Subjects in upper two thirds, lower third darker navy shadows for eventual website text overlay. Natural cinematic warm sunset photography, realistic skin, authentic candid mood. No text, no letters, no logos, no watermarks, no UI. Closely match the two photographic scenes in the provided website reference, but output ONLY the paired photos.

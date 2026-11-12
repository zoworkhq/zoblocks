---
"@zoblocks/signature": patch
---

`SignatureModal` no longer pulls focus back to the name field after the signer has started. The deferred focus that runs when antd's open transition ends could land late on a loaded device, after the signer had already typed and tabbed on, and split what they typed across two fields. It now stands down once the signer presses a key or the pointer inside the dialog.

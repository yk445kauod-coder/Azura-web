---
name: Azura Facebook reel embed
description: How to reliably embed Facebook reels/videos without requiring the JS SDK
---

The FB SDK `<div class="fb-video" data-href="...">` approach is unreliable because it depends on the SDK loading and `window.FB.XFBML.parse()` being called. Use the iframe approach instead.

**Rule:** Always render Facebook embeds as `<iframe src="https://www.facebook.com/plugins/video.php?href=ENCODED_URL&show_text=false&autoplay=true&width=506">` in `getEmbedHtml()`.

**Why:** The SDK approach fails when the FB SDK hasn't fully initialized, which is common in SPAs with client-side routing.

**How to apply:** In `videoProviders.ts` `getEmbedHtml()`, the `facebook` case uses `video.embedUrl` directly as the iframe src. The `embedUrl` is pre-built in `parseFacebook()` using the plugins/video.php endpoint.

**Also:** Normalize `web.facebook.com` → `www.facebook.com` before URL-encoding into the plugins endpoint. Facebook's embed plugin rejects `web.` domain. Use `normalizeFbUrl()` in `parseFacebook()`.

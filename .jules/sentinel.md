## 2025-05-22 - XSS in Custom Markdown Renderer
**Vulnerability:** A custom `renderMarkdown` function was used to convert AI-generated text into HTML using `dangerouslySetInnerHTML`. The function lacked any HTML escaping, allowing an attacker (or a compromised/maliciously prompted AI) to inject arbitrary HTML/JavaScript (XSS) through patterns like `<img src=x onerror=...>` or `<script>`.

**Learning:** When using `dangerouslySetInnerHTML` for custom formatting, developers often forget that the input string must be treated as untrusted. Standard markdown libraries usually handle this, but custom implementations require manual escaping of HTML special characters before applying safe transformations.

**Prevention:** Always escape HTML special characters (`&`, `<`, `>`, `"`, `'`) at the beginning of any custom rendering function that outputs to `dangerouslySetInnerHTML`. Only then should you apply regex or replacement logic to convert specific patterns into a strictly controlled set of safe HTML tags.

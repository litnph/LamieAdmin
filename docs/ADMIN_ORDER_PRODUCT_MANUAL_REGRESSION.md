# Admin order/product manual regression

API contract source `docs/ADMIN_ORDER_PRODUCT_FEATURE_CONTRACT.md` was not present during implementation. The Admin therefore uses the requested minimum `hasCard`, `cardMessage`, `hasBanner`, and `bannerMessage` item fields. The API must accept and return those multipart fields; no mock or fallback was added.

- Create: recipient fields precede orderer fields in DOM/tab order; same-as-orderer still copies only into recipient.
- Toggle card/banner independently on multiple lines, verify required-message validation, submit multipart mapping, edit hydration, and detail rendering.
- Change item totals before manually editing deposit; then edit deposit and change totals again; finally use “Áp dụng cọc mặc định”.
- Quick-import complete, partial and malformed text; verify only recognized fields change and no order is submitted.
- Add/remove multiple chat screenshots in quick import; apply, select the first product, preview by double-click, submit, edit and view detail.
- Search products by a legacy SKU and a four-character SKU.
- Create a four-character uppercase alphanumeric SKU; edit without changing a legacy SKU; verify a changed legacy SKU must follow the new rule.
- Upload/save/reload a product image and verify the URL returned by the API (including its watermark) is rendered without client-side watermarking or cache-busting parameters.

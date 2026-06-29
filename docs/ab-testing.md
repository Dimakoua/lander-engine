# A/B Testing

Lander Engine supports A/B testing out of the box using its **Cascading Override System**. By placing variant‑specific JSON files in a sub‑folder of `json_configs` you can define alternative layouts, themes, or content that are served to a defined portion of traffic.

- **Folder structure**: `json_configs/<campaign>/variants/<variant-name>/...` mirrors the standard config hierarchy. Any file present in a variant folder overrides the same file in the base campaign folder.
- **Activating a variant**: Set the `variant` query parameter (e.g., `?variant=blue`) or configure your traffic‑splitting logic via the `abTest` field in `flow.json` to randomly assign users.
- **Example**:
  ```json
  // json_configs/my-campaign/flow.json
  {
    "steps": [{ "id": "home", "component": "Home" }],
    "abTest": { "variant": "blue", "percentage": 50 }
  }
  ```
  ```json
  // json_configs/my-campaign/variants/blue/theme.json
  {
    "primaryColor": "#1e90ff",
    "logo": "/assets/logo-blue.png"
  }
  ```
  Visitors who fall into the *blue* bucket will receive the overridden theme.
- **Metrics**: Pair the variant with your analytics setup (see the Telemetry guide) to measure conversion rates.

This mechanism works for any configuration file – `theme.json`, `layout.json`, `steps/*.json`, etc., enabling extensive experimentation without code changes.

# Telemetry & Analytics


Lander Engine includes a built-in Telemetry Adapter System to automatically track funnel milestones across all your campaigns. Configure providers in your `lander.config.js` or a campaign's `layout.json`.

```json
"telemetry": {
  "ga4": { "measurementId": "G-XXXXXXXXXX" },
  "metaPixel": { "pixelId": "XXXXXXXXXX" },
  "posthog": { "apiKey": "phc_XXXXXXXXXX" },
  "webhook": { "endpoint": "https://your-api.com/track" }
}
```

Once configured, Lander automatically dispatches standard events (`view_step`, `click_cta`, `submit_lead`, `open_modal`) asynchronously without blocking the UI. Ad-blockers are handled gracefully.

You can also manually track custom events using the `telemetry` action type:

```json
{
  "type": "telemetry",
  "payload": {
    "name": "custom",
    "payload": { "feature": "dark_mode_toggled" }
  }
}
```

---
<!-- Telemetry Docs -->
### Telemetry Event Types
Lander Engine tracks the following built-in event types:

- `view_step` – When a user navigates to a campaign step.
- `click_cta` – When a call-to-action button is clicked.
- `submit_lead` – When a lead form is submitted.
- `open_modal` – When a modal/popup is opened.
- `variant_assigned` – When an A/B test variant is assigned.
- `custom` – Any user-defined event name.

The `view_step` events are deduplicated: if the same step is reported again within **1 second**, the second event is ignored to prevent flooding analytics platforms.

### Disabling Telemetry
If you do not want any telemetry to be sent, simply omit the `telemetry` key from your `lander.config.js`/`lander.config.json`, or set it to `null`:

```json
{
  "telemetry": null
}
```

The engine will skip all tracking calls.
---

# Meta CAPI for the three MUBER pages (TEST)

Sources: `index.html` is the corporate home page; `landings/app/usuarios/page.tsx`
and `landings/app/choferes/page.tsx` are the other two pages. Amplify publishes
GitHub `main` automatically, so keep this change on a review branch until the
Director authorizes production deployment.

The shared `landings/public/muber-web-capi.js` prompts for analytics consent.
Only after acceptance does it send one `ViewContent` per page load to Supabase.
The token and Meta test code are never included in the static build. People can
change the choice using the Privacy button. `/descargar` and other routes do not
send events.

To enable a TEST preview build, set the public build variable
`NEXT_PUBLIC_MUBER_CAPI_ENDPOINT` to the TEST function URL. With this variable
unset, the static build has no tracking or consent banner. Do not set the
variable on Amplify `main` until the production review is complete.

The current pages contain links to the app and email, not completed payment or
application forms. Their page views must not be reported as `Purchase`, `Lead`,
or `SubmitApplication`.

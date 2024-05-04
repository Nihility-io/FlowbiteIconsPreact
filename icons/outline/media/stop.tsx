import { JSX } from "preact"
export default (props: JSX.IntrinsicElements["svg"]): JSX.Element => (
<svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
  <rect width="12" height="12" x="6" y="6" stroke="currentColor" stroke-linejoin="round" stroke-width="2" rx="1"/>
</svg>
)
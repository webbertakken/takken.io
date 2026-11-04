import React from 'react'
import {
  FaAt,
  FaGithub,
  FaLinkedinIn,
  FaStackOverflow,
  FaTwitch,
  FaXTwitter,
} from 'react-icons/fa6'

const places = [
  { label: 'Email', href: 'mailto:webber@takken.io', Icon: FaAt },
  { label: 'X (formerly Twitter)', href: 'https://x.com/webbertakken', Icon: FaXTwitter },
  { label: 'GitHub', href: 'https://github.com/webbertakken', Icon: FaGithub },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/webbertakken/', Icon: FaLinkedinIn },
  {
    label: 'Stack Overflow',
    href: 'https://stackoverflow.com/users/3593896/webber',
    Icon: FaStackOverflow,
  },
  { label: 'Twitch', href: 'https://twitch.tv/webbertakken', Icon: FaTwitch },
] as const

/** Where else to find Webber, set quietly at the foot of the letter. */
const Elsewhere = (): React.JSX.Element => (
  <ul aria-label="Elsewhere" className="m-0 flex list-none gap-1 p-0">
    {places.map(({ label, href, Icon }) => (
      <li key={label}>
        <a
          href={href}
          aria-label={label}
          className="flex size-11 items-center justify-center rounded-md text-gray-500 hover:text-pink focus-visible:text-pink dark:text-gray-400"
          {...(href.startsWith('http') && { target: '_blank', rel: 'noreferrer' })}
        >
          <Icon size={20} aria-hidden="true" />
        </a>
      </li>
    ))}
  </ul>
)

export default Elsewhere

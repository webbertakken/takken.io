import React, { useCallback, useEffect, useRef, useState } from 'react'
import OriginalNavbarContent from '@theme-original/Navbar/Content'
import { useLocation } from '@docusaurus/router'
import clsx from 'clsx'
import { useAuth } from '@site/src/contexts/AuthContext'

const UserIcon = (): React.ReactElement => (
  <svg className="h-8 w-8 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="8" r="4" />
    <path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z" />
  </svg>
)

const ProfileMenu = (): React.ReactElement => {
  const { user, loading, signInWithGoogle, signInWithGitHub, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  if (loading) return <div className="h-8 w-8" />

  const initials = user?.displayName?.charAt(0).toUpperCase() ?? '?'

  return (
    <div ref={menuRef} className="relative ml-2 flex items-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-0 bg-transparent p-0 transition-opacity hover:opacity-80"
        aria-label="User menu"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'Avatar'}
            className="h-8 w-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : user ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {initials}
          </span>
        ) : (
          <UserIcon />
        )}
      </button>

      {open && (
        <div
          className={clsx(
            'absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border bg-white p-2 shadow-lg',
            'dark:border-gray-700 dark:bg-gray-800',
          )}
        >
          {user ? (
            <>
              <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                {user.displayName && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.displayName}
                  </p>
                )}
                {user.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  void signOut()
                  setOpen(false)
                }}
                className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  void signInWithGoogle()
                  setOpen(false)
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Sign in with Google
              </button>
              <button
                type="button"
                onClick={() => {
                  void signInWithGitHub()
                  setOpen(false)
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Sign in with GitHub
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const NavbarContent = (): React.ReactElement => {
  const { pathname } = useLocation()
  const isLearningPage = pathname === '/learning' || pathname.startsWith('/learning/')

  if (!isLearningPage) {
    return <OriginalNavbarContent />
  }

  return (
    <div className="flex w-full items-center">
      <div className="flex-1">
        <OriginalNavbarContent />
      </div>
      <ProfileMenu />
    </div>
  )
}

export default NavbarContent

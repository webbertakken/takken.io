---
title: 'Example post'
date: '2021-03-21'
description: "To test styles and rendering."
categories: 
  - 'Software development'
---

## The standard Lorem Ipsum passage, used since the 1500s
"Lorem ipsum dolor sit amet, consectetur [adipiscing elit](#), sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

## Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
"Sed ut perspiciatis [unde omnis](#) iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"

## 1914 translation by H. Rackham
"But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give [you](#) a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no [resultant](#) pleasure?"

### In summation

1. Inde omnis iste natus error sit voluptatem accusantium dolo
2. Ero eos et accusamus et iusto `something` odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum q
3. Pedit quo minus id `quod`, `maxime`, and `placeat`
   
#### But especially

4. Te rerum necessitatibus saepe

## Examples

Here are some code examples

### JSX code

```jsx
import { Button } from 'antd'
import firebase from 'firebase/app'
import { useState } from 'react'
import { AiOutlineClose, AiTwotoneLock } from 'react-icons/all'
import { useAuth, AuthCheck } from 'reactfire'

const loadingDelay = async (delayMs = 100) => {
  return new Promise((resolve) => setTimeout(() => resolve('loading'), delayMs))
}

const SignInSignOutButton = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const auth = useAuth()

  const signIn = async () => {
    try {
      const action = auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      const result = await Promise.race([action, loadingDelay()])
      if (result === 'loading') {
        setIsLoading(true)
      }
      await action
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const action = auth.signOut()
      const result = await Promise.race([action, loadingDelay()])
      if (result === 'loading') {
        setIsLoading(true)
      }
      await action
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      {...props}
      onClick={auth.currentUser ? signOut : signIn}
      loading={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AuthCheck fallback={<AiTwotoneLock />}>
        {isHovered ? <AiOutlineClose color="#ff4d4f" /> : <AiTwotoneLock color="#52c41a" />}
      </AuthCheck>
    </Button>
  )
}

export default SignInSignOutButton
```

### Typescript code

Without highlighting

```ts
import { createSlice } from '@reduxjs/toolkit';

export const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    incremented: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decremented: (state) => {
      state.value -= 1;
    },
  },
});

export const { incremented, decremented } = counterSlice.actions;
```

With highlighting

```ts{1,5-7}
import { createSlice } from '@reduxjs/toolkit';

export const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    incremented: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decremented: (state) => {
      state.value -= 1;
    },
  },
});

export const { incremented, decremented } = counterSlice.actions;
```

## Conclusion?

No. Probably [not](#).

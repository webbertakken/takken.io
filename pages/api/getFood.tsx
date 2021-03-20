import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyIdentityToken } from '@/core/server/verifyIdentityToken'

const favoriteFoods = ['pizza', 'burger', 'chips', 'tortilla']
const getFood = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.headers.token

  try {
    await verifyIdentityToken(token)
    return res.status(200).json({
      food: favoriteFoods[Math.floor(Math.random() * favoriteFoods.length)],
    })
  } catch (error) {
    return res.status(401).send('You are unauthorised')
  }
}

export default getFood

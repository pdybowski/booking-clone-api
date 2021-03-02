const mongoose = require('mongoose')
const express = require('express')
const User = require('../models/user')
const ApiError = require('../helpers/apiError')
const router = express.Router()
const { HOTEL_OWNER_ROLE, USER_ROLE } = require('../models/roles')
const { Reservation } = require('../models/reservation')
const { Hotel } = require('../models/hotel')

router.get('/', async (req, res) => {
  const users = await User.find()

  res.send(users)
})

router.get('/owners', async (req, res) => {
  const owners = await User.find({ role: HOTEL_OWNER_ROLE })

  res.json(owners)
})

router.put('/owner/accept/:email', async (req, res) => {
  const email = req.params.email

  try {
    await User.updateOne({ email: email }, { role: HOTEL_OWNER_ROLE })

    res.status(200).json('Done')
  } catch (err) {
    throw new ApiError(500, 'Something went wrong')
  }
})

router.put('/owner/status/:email', async (req, res) => {
  const email = req.params.email

  try {
    await User.updateOne({ email: email }, { isVerified: true })

    res.status(200).json('Done')
  } catch (err) {
    throw new ApiError(500, 'Something went wrong')
  }
})

router.post('/users/delete', async (req, res) => {
  const { forceDelete } = req.query
  const isForceDelete = forceDelete === 'true'
  const useresWithReservation = []
  try {
    await req.body.map(async (id) => {
      const reservation = await Reservation.find({ userId: id })

      if (reservation.length > 0 && isForceDelete) {
        await Reservation.deleteMany({ userId: id })
      }

      if (reservation.length > 0) {
        useresWithReservation.push(id)
        throw new ApiError(400, 'Remove reservations first')
      }
      await User.findByIdAndDelete(id)
      res
        .status(200)
        .send(
          'User deleted, users where neeed remove reserfation first' +
            useresWithReservation
        )
    })
  } catch (err) {
    res.status(500).send(err)
  }
})

router.delete('/owner/:email', async (req, res) => {
  const email = req.params.email

  try {
    const user = await User.findOneAndDelete({
      email: email,
      role: HOTEL_OWNER_ROLE,
    })
    if (!user) {
      throw new ApiError(400, 'Wrong email or user is not a hotel owner')
    }

    res.status(200).json(user)
  } catch (err) {
    throw new ApiError(500, 'Something went wrong')
  }
})

router.delete('/:email', async (req, res) => {
  const email = req.params.email

  try {
    const user = await User.findOneAndDelete({
      email: email,
      role: USER_ROLE,
    })
    if (!user) {
      throw new ApiError(400, 'Wrong email')
    }

    res.status(200).json(user)
  } catch (err) {
    throw new ApiError(500, 'Something went wrong')
  }
})

router.delete('/hotel/:id', async (req, res) => {
  const hotelId = req.params.id
  const { forceDelete } = req.query
  const isForceDelete = forceDelete === 'true'
  const reservation = await Reservation.find({ hotelId: id })
  try {
    if (reservation.length > 0 && isForceDelete) {
      await Reservation.deleteMany(hotelId)
      await Hotel.findByIdAndDelete(hotelId)
      //sms
    }

    if (reservation.length > 0) {
      throw new ApiError(400, 'Remove reservation first')
    }

    await Hotel.findByIdAndDelete(hotelId)
    res.status(200).send('Hotel removed')
  } catch (err) {
    throw new ApiError(500, 'Something went wrong')
  }
})

module.exports = router

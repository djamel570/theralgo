/**
 * Bookings Dashboard Page
 */

import BookingCalendar from './BookingCalendar'

export default function BookingsPage() {
  return (
    <BookingCalendar
      onCreateBooking={async (slot) => {
        // Handle create booking
        console.log('Create booking:', slot)
      }}
      onEditBooking={async (booking) => {
        // Handle edit booking
        console.log('Edit booking:', booking)
      }}
      onConfigureAvailability={() => {
        // Handle configure availability
        console.log('Configure availability')
      }}
    />
  )
}

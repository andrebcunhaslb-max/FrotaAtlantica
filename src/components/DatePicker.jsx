import DatePickerLib from 'react-date-picker'
import 'react-date-picker/dist/DatePicker.css'
import 'react-calendar/dist/Calendar.css'
import './DatePickerFrota.css'

/**
 * DatePicker que usa react-date-picker com valor em formato string "YYYY-MM-DD".
 * @param {string} value - Data em "YYYY-MM-DD" ou string vazia
 * @param {(value: string) => void} onChange - Recebe "YYYY-MM-DD" ou ""
 * @param {string} [className] - Classes adicionais
 * @param {string} [locale] - Locale (default: pt-PT)
 */
export default function DatePicker({ value, onChange, className = '', locale = 'pt-PT', ...props }) {
  const dateValue = value ? new Date(value + 'T12:00:00') : null

  const handleChange = (val) => {
    if (!val) {
      onChange('')
      return
    }
    const d = val instanceof Date ? val : new Date(val)
    onChange(d.toISOString().slice(0, 10))
  }

  return (
    <DatePickerLib
      value={dateValue}
      onChange={handleChange}
      locale={locale}
      format="dd/MM/yyyy"
      showLeadingZeros
      clearIcon={null}
      className={`date-picker-frota ${className}`.trim()}
      calendarProps={{
        className: 'date-picker-calendar-frota',
        tileClassName: ({ date, view }) => {
          if (view !== 'month') return null
          const d = dateValue
          if (!d) return null
          return date.getDate() === d.getDate() &&
            date.getMonth() === d.getMonth() &&
            date.getFullYear() === d.getFullYear()
            ? 'frota-tile-active'
            : null
        },
      }}
      {...props}
    />
  )
}

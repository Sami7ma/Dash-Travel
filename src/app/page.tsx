"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { City } from '@/lib/types'

export default function Home() {
  const router = useRouter()
  const [cities, setCities] = useState<City[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [ready, setReady] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await fetch('/api/cities')
        const data = await res.json()
        if (Array.isArray(data)) setCities(data)
      } catch {
        // Cities will show empty — non-fatal
      }
    }
    fetchCities()
    setTimeout(() => setReady(true), 100)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!from || !to || !date) {
      setFormError('Please fill all fields')
      return
    }
    if (from === to) {
      setFormError('Origin and destination cannot be the same')
      return
    }
    router.push(`/book?from=${from}&to=${to}&date=${date}&type=ONE_WAY`)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="hero">
      {/* Background Image */}
      <div className="hero-bg">
        <img src="/bus-aerial.jpg" alt="Ethiopian landscape" />
      </div>
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-content">
        {/* Logo / Brand */}
        <div className={`${ready ? 'animate-in' : ''}`} style={{ opacity: ready ? 1 : 0, marginBottom: '0.5rem' }}>
          <p style={{ color: 'var(--gold)', fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Dash Travel
          </p>
        </div>

        <h1 className={`${ready ? 'animate-in animate-in-delay-1' : ''}`} style={{
          opacity: ready ? 1 : 0,
          fontSize: 'clamp(2rem, 6vw, 3.2rem)',
          lineHeight: 1.15,
          marginBottom: '0.75rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Travel Ethiopia<br />Your Way
        </h1>

        <p className={`${ready ? 'animate-in animate-in-delay-2' : ''}`} style={{
          opacity: ready ? 1 : 0,
          color: 'var(--text-muted)',
          fontSize: '1rem',
          marginBottom: '2.5rem',
          maxWidth: '380px'
        }}>
          Book bus tickets across the country. Pick your seat, pay online, and go.
        </p>

        {/* Search Card */}
        <form onSubmit={handleSearch} className={`glass ${ready ? 'animate-in animate-in-delay-3' : ''}`} style={{
          opacity: ready ? 1 : 0,
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {/* Inline form error replaces alert() */}
          {formError && (
            <div role="alert" style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>⚠️</span> {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="from-city" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                📍 From
              </label>
              <select id="from-city" className="select" value={from} onChange={(e) => setFrom(e.target.value)} required aria-label="Departure city">
                <option value="">Select city</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="to-city" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                📍 To
              </label>
              <select id="to-city" className="select" value={to} onChange={(e) => setTo(e.target.value)} required aria-label="Destination city">
                <option value="">Select city</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="travel-date" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
              📅 Travel Date
            </label>
            <input
              id="travel-date"
              className="input"
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
              aria-label="Travel date"
            />
          </div>

          <button type="submit" className="btn btn-gold btn-full" style={{ marginTop: '0.5rem' }}>
            Search Buses →
          </button>
        </form>

        {/* My Bookings Link */}
        <button
          onClick={() => router.push('/my-bookings')}
          className={`btn btn-outline btn-full ${ready ? 'animate-in animate-in-delay-4' : ''}`}
          style={{ opacity: ready ? 1 : 0, marginTop: '1rem' }}
        >
          📋 My Bookings
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// Secret PIN to reveal SafeHer (e.g. type "1234" then press =)
const SECRET_CODE = '1234'

export default function DisguisePage() {
  const router = useRouter()
  const [display, setDisplay] = useState('0')
  const [equation, setEquation] = useState('')
  const [sequence, setSequence] = useState('')
  const [prevResult, setPrevResult] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [justCalculated, setJustCalculated] = useState(false)
  const [unlockHint, setUnlockHint] = useState(false)

  // Show hint after 10 seconds for new users
  useEffect(() => {
    const t = setTimeout(() => setUnlockHint(true), 10000)
    return () => clearTimeout(t)
  }, [])

  const handleNum = (num: string) => {
    const newSeq = sequence + num
    setSequence(newSeq)

    // Check for secret code
    if (newSeq.endsWith(SECRET_CODE)) {
      // Flash and redirect to SafeHer
      setTimeout(() => router.push('/dashboard/home'), 300)
      return
    }

    if (justCalculated) {
      setDisplay(num)
      setEquation('')
      setJustCalculated(false)
    } else {
      setDisplay(prev => prev === '0' ? num : prev + num)
    }
  }

  const handleOperator = (op: string) => {
    setSequence('')
    setPrevResult(parseFloat(display))
    setOperator(op)
    setEquation(display + ' ' + op)
    setDisplay('0')
    setJustCalculated(false)
  }

  const handleEquals = () => {
    setSequence('')
    if (operator === null || prevResult === null) return
    const curr = parseFloat(display)
    let result = 0
    switch (operator) {
      case '+': result = prevResult + curr; break
      case '−': result = prevResult - curr; break
      case '×': result = prevResult * curr; break
      case '÷': result = curr !== 0 ? prevResult / curr : NaN; break
    }
    const resultStr = isNaN(result) ? 'Error' : String(parseFloat(result.toFixed(8)))
    setDisplay(resultStr)
    setEquation(equation + ' ' + display + ' =')
    setPrevResult(null)
    setOperator(null)
    setJustCalculated(true)
  }

  const handleClear = () => {
    setDisplay('0')
    setEquation('')
    setOperator(null)
    setPrevResult(null)
    setSequence('')
    setJustCalculated(false)
  }

  const handleDecimal = () => {
    if (!display.includes('.')) setDisplay(d => d + '.')
  }

  const handleToggleSign = () => {
    setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d)
  }

  const handlePercent = () => {
    setDisplay(d => String(parseFloat(d) / 100))
  }

  const BUTTONS = [
    [
      { label: 'AC', type: 'func',   action: handleClear },
      { label: '+/-', type: 'func',  action: handleToggleSign },
      { label: '%', type: 'func',    action: handlePercent },
      { label: '÷', type: 'op',     action: () => handleOperator('÷') },
    ],
    [
      { label: '7', type: 'num', action: () => handleNum('7') },
      { label: '8', type: 'num', action: () => handleNum('8') },
      { label: '9', type: 'num', action: () => handleNum('9') },
      { label: '×', type: 'op', action: () => handleOperator('×') },
    ],
    [
      { label: '4', type: 'num', action: () => handleNum('4') },
      { label: '5', type: 'num', action: () => handleNum('5') },
      { label: '6', type: 'num', action: () => handleNum('6') },
      { label: '−', type: 'op', action: () => handleOperator('−') },
    ],
    [
      { label: '1', type: 'num', action: () => handleNum('1') },
      { label: '2', type: 'num', action: () => handleNum('2') },
      { label: '3', type: 'num', action: () => handleNum('3') },
      { label: '+', type: 'op', action: () => handleOperator('+') },
    ],
    [
      { label: '0', type: 'zero', action: () => handleNum('0') },
      { label: '.', type: 'num',  action: handleDecimal },
      { label: '=', type: 'eq',  action: handleEquals },
    ],
  ]

  const btnStyle = (type: string) => {
    if (type === 'func') return { bg: '#A5A5A5', text: '#1C1C1E', active: '#D4D4D4' }
    if (type === 'op' || type === 'eq') return { bg: '#FF9F0A', text: 'white', active: '#FFC53D' }
    return { bg: '#333333', text: 'white', active: '#555555' }
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      background: '#1C1C1E', display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', padding: '0 12px 24px',
      position: 'relative',
    }}>

      {/* Hint overlay */}
      {unlockHint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute', top: 40, left: 16, right: 16,
            background: 'rgba(255,159,10,0.15)', border: '1px solid rgba(255,159,10,0.3)',
            borderRadius: 12, padding: '10px 14px', zIndex: 10,
          }}
          onClick={() => setUnlockHint(false)}
        >
          <p style={{ color: '#FF9F0A', fontSize: 12, textAlign: 'center' }}>
            🔐 Type <strong>1234</strong> then tap = to return to SafeHer
          </p>
        </motion.div>
      )}

      {/* Display */}
      <div style={{ padding: '0 8px 8px', textAlign: 'right' }}>
        <p style={{ color: '#666', fontSize: 20, minHeight: 28 }}>{equation}</p>
        <p style={{
          color: 'white',
          fontSize: display.length > 10 ? 36 : display.length > 6 ? 52 : 72,
          fontWeight: 200,
          lineHeight: 1.1,
          letterSpacing: -2,
          transition: 'font-size 0.1s',
        }}>
          {display}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {BUTTONS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 12 }}>
            {row.map((btn) => {
              const s = btnStyle(btn.type)
              return (
                <motion.button
                  key={btn.label}
                  whileTap={{ scale: 0.92, backgroundColor: s.active }}
                  onClick={btn.action}
                  style={{
                    flex: btn.type === 'zero' ? 2 : 1,
                    height: 80,
                    borderRadius: 40,
                    background: s.bg,
                    color: s.text,
                    fontSize: 32,
                    fontWeight: 400,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: btn.type === 'zero' ? 'flex-start' : 'center',
                    paddingLeft: btn.type === 'zero' ? 28 : 0,
                  }}
                >
                  {btn.label}
                </motion.button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

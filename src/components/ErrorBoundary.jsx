import { Component } from 'react'

// A crashed render used to leave a totally blank screen with no clue why.
// This catches it and shows the actual error so it can be screenshotted
// and fixed, instead of a silent white page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      const { error } = this.state
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            background: '#f0f9ff',
            color: '#0f172a',
          }}
        >
          <p style={{ fontSize: '48px', marginBottom: '8px' }}>⚠️</p>
          <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
            Something broke
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Screenshot this and send it over:
          </p>
          <pre
            style={{
              fontSize: '11px',
              textAlign: 'left',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              maxWidth: '100%',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {String(error?.message || error)}
            {error?.stack ? `\n\n${error.stack}` : ''}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

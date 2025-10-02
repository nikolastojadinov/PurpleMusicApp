import React from 'react';

// Generic error boundary so unexpected payment or modal crashes never blank the screen
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Basic log; in production integrate remote logging
    console.error('[ErrorBoundary] Caught error:', error, info);
  }
  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:'100vh', background:'#000', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px', textAlign:'center'}}>
          <div style={{fontSize:54, lineHeight:1, marginBottom:24}}>⚠️</div>
          <h1 style={{fontSize:22, margin:'0 0 14px'}}>Something went wrong</h1>
          <p style={{fontSize:14, opacity:.75, margin:'0 0 26px', maxWidth:420}}>An unexpected error occurred. The app isolated it so your session isn't lost. You can try reloading to continue.</p>
          <button onClick={this.handleReload} style={{background:'linear-gradient(135deg,#1db954,#169943)', color:'#fff', border:'none', padding:'14px 28px', borderRadius:30, fontWeight:600, cursor:'pointer', fontSize:15}}>Reload App</button>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre style={{marginTop:30, fontSize:11, textAlign:'left', background:'#111', padding:16, borderRadius:12, maxWidth:540, overflow:'auto'}}>{String(this.state.error?.stack || this.state.error)}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

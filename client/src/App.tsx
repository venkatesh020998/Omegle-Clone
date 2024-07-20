import './App.css'
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LandingPage from './components/landingPage';
import VideoCall from './components/videoPage';
import { SocketProvider } from './components/socketProvider';

function App() {

  return (
    <BrowserRouter>
    <SocketProvider>
    {/* <ErrorBoundary FallbackComponent={ErrorFallback}> */}
      <Routes>
        <Route path="/" Component={LandingPage} />
        <Route path="/video" Component={VideoCall} />

      </Routes>
      </SocketProvider>
    {/* </ErrorBoundary> */}
  </BrowserRouter>
  )
}

export default App

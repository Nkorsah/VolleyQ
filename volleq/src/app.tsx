
import ReactDOM from 'react-dom/client';
import MapComponent from './maps/mapcomp';




export default function App() {
  const container = document.getElementById('root') as HTMLElement;
  if (container) {
      const root = ReactDOM.createRoot(container);
      root.render(<MapComponent/>);
    } else {
      console.error('Root element #root not found in the DOM');
  }
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <p>help me help me</p>
      <MapComponent/>
    </div>
  );
}


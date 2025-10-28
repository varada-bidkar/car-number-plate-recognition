import React, { useState, useRef, useEffect } from 'react';
import { CloudArrowUpIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const API_URL = "http://localhost:8000/api/recognize";

function Spinner() {
  return (
    <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
  );
}

export default function App(){
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem('anpr_history_v2');
    if(raw) setHistory(JSON.parse(raw));
  }, []);

  useEffect(() => {
    // draw bbox when result available
    if(!preview || !result) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if(!img || !canvas) return;
    // set canvas size to displayed image size
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const bboxes = result.result || [];
    // find primary: last non-empty text
    const primary = [...bboxes].reverse().find(b=> (b.text && b.text.trim().length>0));
    if(primary){
      const [x,y,w,h] = primary.bbox;
      // scale assuming preview image natural size equals original; if not, scale based on naturalWidth
      const scaleX = img.width / img.naturalWidth || 1;
      const scaleY = img.height / img.naturalHeight || 1;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(37,99,235,0.95)';
      ctx.strokeRect(x*scaleX, y*scaleY, w*scaleX, h*scaleY);
      ctx.fillStyle = 'rgba(37,99,235,0.95)';
      ctx.font = '18px sans-serif';
      const text = primary.text || '';
      ctx.fillText(text, x*scaleX + 6, y*scaleY - 8);
    }
  }, [result, preview]);

  function handleFile(e){
    const f = e.target.files[0];
    if(!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }

  async function handleRecognize(){
    if(!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try{
      const res = await fetch(API_URL, { method: 'POST', body: fd });
      const data = await res.json();
      setResult(data);
      // extract primary plate text
      const bboxes = data.result || [];
      const primary = [...bboxes].reverse().find(b=> (b.text && b.text.trim().length>0));
      const plateText = primary ? primary.text.replace(/\s+/g,' ').trim() : '—';
      const entry = { text: plateText, time: Date.now() };
      const newHist = [entry, ...history].slice(0,20);
      setHistory(newHist);
      localStorage.setItem('anpr_history_v2', JSON.stringify(newHist));
    }catch(err){
      console.error(err);
      setResult({ success:false, error: String(err) });
    }finally{
      setLoading(false);
    }
  }

  function handleCopy(){
    if(!result) return;
    const bboxes = result.result || [];
    const primary = [...bboxes].reverse().find(b=> (b.text && b.text.trim().length>0));
    const plateText = primary ? primary.text.replace(/\s+/g,' ').trim() : '';
    if(plateText){
      navigator.clipboard.writeText(plateText);
      alert('Copied: ' + plateText);
    }
  }

  function handleClearHistory(){
    setHistory([]);
    localStorage.removeItem('anpr_history_v2');
  }

  function handleReset(){
    setFile(null);
    setPreview(null);
    setResult(null);
    const canvas = canvasRef.current;
    if(canvas){
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0, canvas.width, canvas.height);
    }
  }

  const detectedText = (() => {
    if(!result) return '—';
    const bboxes = result.result || [];
    const primary = [...bboxes].reverse().find(b=> (b.text && b.text.trim().length>0));
    return primary ? primary.text.replace(/\s+/g,' ').trim() : '—';
  })();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-50 rounded-lg">
                <CloudArrowUpIcon className="w-8 h-8 text-brand-700" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Car Number Plate Recognition</h1>
                <p className="text-sm text-gray-500">Only the plate number is shown — clean & ready to copy.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleReset} className="btn border">Reset</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 border rounded-xl">
                <div className="flex items-center gap-4">
                  <label htmlFor="file" className="flex items-center gap-3 cursor-pointer">
                    <div className="p-3 rounded-lg bg-gray-100">
                      <CloudArrowUpIcon className="w-7 h-7 text-brand-700" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Upload image</div>
                      <div className="text-xs text-gray-500">JPG or PNG. Front-facing plates give best results.</div>
                    </div>
                  </label>
                  <input id="file" type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={handleRecognize} disabled={!file || loading} className="btn bg-brand-500 text-white">
                      {loading ? <Spinner /> : <span className="flex items-center gap-2"><ArrowPathIcon className="w-5 h-5" /> Recognize</span>}
                    </button>
                    <button onClick={handleCopy} disabled={!result} className="btn border flex items-center gap-2">
                      <ClipboardDocumentIcon className="w-5 h-5" /> Copy Number
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
                    {!preview ? (
                      <div className="text-gray-400">No image selected</div>
                    ) : (
                      <div className="relative">
                        <img ref={imgRef} src={preview} alt="preview" className="max-w-full rounded-md" />
                        <canvas ref={canvasRef} className="absolute left-0 top-0 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="card">
                      <h3 className="text-lg font-medium">Detected Plate</h3>
                      <div className="mt-3">
                        <div className="text-3xl font-bold text-brand-700">{detectedText}</div>
                        <div className="mt-2 text-sm text-gray-500">Last recognized plate (cleaned)</div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-600">Recognition History</h4>
                        <div className="mt-2 space-y-2 max-h-40 overflow-auto">
                          {history.length === 0 ? <div className="text-sm text-gray-400">No history yet.</div> : history.map((h, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div>
                                <div className="font-medium">{h.text}</div>
                                <div className="text-xs text-gray-400">{new Date(h.time).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button onClick={handleClearHistory} className="btn border text-sm">Clear History</button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div>
              <div className="card">
                <h4 className="text-lg font-medium">Tips</h4>
                <ul className="mt-3 text-sm text-gray-600 list-disc list-inside">
                  <li>Use clear front-facing images for best results.</li>
                  <li>Crop the image so the plate is prominent.</li>
                  <li>For faster OCR, enable GPU support in EasyOCR (optional).</li>
                </ul>
                <div className="mt-4 text-xs text-gray-400">Built with ❤️ using OpenCV + EasyOCR</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

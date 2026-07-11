import React, { useState, useEffect } from 'react';
import { Clock, Plus, X } from 'lucide-react';

const TIME_ZONES = [
  { id: 'UTC', label: 'UTC', offset: 0 },
  { id: 'EST', label: 'Eastern (EST)', offset: -5 },
  { id: 'CST', label: 'Central (CST)', offset: -6 },
  { id: 'MST', label: 'Mountain (MST)', offset: -7 },
  { id: 'PST', label: 'Pacific (PST)', offset: -8 },
  { id: 'GMT', label: 'London (GMT)', offset: 0 },
  { id: 'CET', label: 'Paris (CET)', offset: 1 },
  { id: 'EET', label: 'Cairo (EET)', offset: 2 },
  { id: 'IST', label: 'India (IST)', offset: 5.5 },
  { id: 'SGT', label: 'Singapore (SGT)', offset: 8 },
  { id: 'JST', label: 'Tokyo (JST)', offset: 9 },
  { id: 'AEST', label: 'Sydney (AEST)', offset: 10 },
  { id: 'NZST', label: 'Auckland (NZST)', offset: 12 },
  { id: 'HST', label: 'Hawaii (HST)', offset: -10 },
  { id: 'AKST', label: 'Alaska (AKST)', offset: -9 },
];

export default function ClockApp() {
  const [selectedZones, setSelectedZones] = useState(['UTC', 'EST', 'IST', 'JST']);
  const [time, setTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInZone = (offset) => {
    const utcTime = new Date(time.getTime() + time.getTimezoneOffset() * 60000);
    const zoneTime = new Date(utcTime.getTime() + offset * 60 * 60 * 1000);
    return zoneTime;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleZone = (zoneId) => {
    setSelectedZones((prev) =>
      prev.includes(zoneId)
        ? prev.filter((z) => z !== zoneId)
        : [...prev, zoneId]
    );
  };

  const removeZone = (zoneId) => {
    setSelectedZones((prev) => prev.filter((z) => z !== zoneId));
  };

  const getZoneData = (zoneId) => {
    return TIME_ZONES.find((z) => z.id === zoneId);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock size={32} color="white" />
            <h1 className="text-4xl font-bold text-white">World Clock</h1>
          </div>
          <p className="text-purple-100">Track time across multiple time zones</p>
        </div>

        {/* Add Zone Button */}
        <div className="mb-6 relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all backdrop-blur-sm border border-white border-opacity-30"
          >
            <Plus size={20} />
            Add Time Zone
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {TIME_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      toggleZone(zone.id);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 ${
                      selectedZones.includes(zone.id)
                        ? 'bg-purple-100'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedZones.includes(zone.id)}
                      onChange={() => {}}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800">{zone.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {selectedZones.map((zoneId) => {
            const zone = getZoneData(zoneId);
            if (!zone) return null;
            const zoneTime = getTimeInZone(zone.offset);

            return (
              <div
                key={zoneId}
                className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{zone.label}</h2>
                    <p className="text-sm text-gray-500">UTC {zone.offset > 0 ? '+' : ''}{zone.offset}</p>
                  </div>
                  <button
                    onClick={() => removeZone(zoneId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-5xl font-mono font-bold text-purple-600">
                    {formatTime(zoneTime)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(zoneTime)}
                  </div>
                </div>

                {/* Analog Clock */}
                <div className="mt-4 flex justify-center">
                  <AnalogClock time={zoneTime} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {selectedZones.length === 0 && (
          <div className="text-center py-16">
            <Clock size={48} color="white" className="mx-auto mb-4 opacity-50" />
            <p className="text-white text-lg opacity-75">
              No time zones selected. Add one to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalogClock({ time }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = (minutes * 6) + (seconds * 0.1);
  const secondDeg = seconds * 6;

  return (
    <div className="relative w-32 h-32 rounded-full border-4 border-purple-300 bg-white shadow-md flex items-center justify-center">
      {/* Center dot */}
      <div className="absolute w-2 h-2 bg-purple-600 rounded-full z-10" />

      {/* Hour markers */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-3 bg-gray-400 origin-bottom"
          style={{
            left: '50%',
            top: '4px',
            marginLeft: '-2px',
            transform: `translateX(-50%) rotate(${i * 30}deg)`,
          }}
        />
      ))}

      {/* Hour hand */}
      <div
        className="absolute w-1 h-10 bg-purple-800 rounded-full origin-bottom"
        style={{
          left: '50%',
          top: '50%',
          marginLeft: '-2px',
          marginTop: '-10px',
          transform: `translateX(-50%) rotate(${hourDeg}deg)`,
          transformOrigin: 'center 10px',
        }}
      />

      {/* Minute hand */}
      <div
        className="absolute w-0.5 h-12 bg-purple-600 rounded-full origin-bottom"
        style={{
          left: '50%',
          top: '50%',
          marginLeft: '-1px',
          marginTop: '-12px',
          transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
          transformOrigin: 'center 12px',
        }}
      />

      {/* Second hand */}
      <div
        className="absolute w-px h-14 bg-red-500 origin-bottom"
        style={{
          left: '50%',
          top: '50%',
          marginLeft: '0',
          marginTop: '-14px',
          transform: `translateX(-50%) rotate(${secondDeg}deg)`,
          transformOrigin: 'center 14px',
        }}
      />
    </div>
  );
}

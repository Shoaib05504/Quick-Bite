import React from 'react';
import QRCode from 'react-qr-code';
import './QRCodeBox.css';

const QRCodeBox = ({ value }) => {
  return (
    <div className="qr-code-wrapper">
      <div className="qr-code-frame">
        <QRCode value={value || 'https://quickbite.local'} size={170} bgColor="transparent" fgColor="#ff9e34" />
      </div>
      <p className="qr-code-caption">Scan to join the QuickBite group</p>
    </div>
  );
};

export default QRCodeBox;

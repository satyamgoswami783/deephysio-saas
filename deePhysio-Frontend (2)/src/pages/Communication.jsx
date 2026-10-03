import React from 'react';
import AnnouncementsHub from '../components/communication/AnnouncementsHub';

const Communication = () => {
  return (
    <div className="min-h-screen bg-[#fcfaf7]/50 pb-12">
      <AnnouncementsHub isEmbedded={false} />
    </div>
  );
};

export default Communication;

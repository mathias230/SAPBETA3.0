
"use client";

import html2canvas from 'html2canvas';

export const exportElementAsPNG = async (elementId: string, fileName: string = 'tournament-export.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for export:', elementId);
    alert('Error: Could not find element to export.');
    return;
  }

  try {
    const isDarkMode = document.documentElement.classList.contains('dark');
    // Light theme background: #F2F0F4 (from globals.css --background: 255 17% 95%;)
    // Dark theme background: #1C1A23 (from globals.css --background: 258 10% 12%;)
    const exportBackgroundColor = isDarkMode ? '#1C1A23' : '#F2F0F4';

    const canvas = await html2canvas(element, {
      scale: 2, // Increase scale for better resolution
      useCORS: true, // If you have external images
      backgroundColor: exportBackgroundColor
    });
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting element as PNG:', error);
    alert('Error exporting image. Please try again.');
  }
};


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
    const canvas = await html2canvas(element, {
      scale: 2, // Increase scale for better resolution
      useCORS: true, // If you have external images
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim() === '255 17% 95%' ? '#F2F0F4' : '#201A29' // Use theme background
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

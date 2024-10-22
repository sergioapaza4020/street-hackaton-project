'use client'

import React, { useState } from 'react';
import styles from "./page.module.css";
import CanvasComponent from '@/components/CanvasComponent';

export default function Home() {
  return (
    <main>
      <h1>Street Routes System</h1>
      <div className="main-canvas">
        <CanvasComponent></CanvasComponent>
      </div>
    </main>
  );
}

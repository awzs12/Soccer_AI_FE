import React from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/VideoViewer.css';

const VideoViewer = () => {
    const { type, videoId } = useParams();

    return (
        <div>
            <Sidebar />
            <div className='videoviewerBody'>
                <h1>{type === 'analysis' ? 'Analysis View' : type === 'broadcasting' ? 'Broadcasting View' : 'Default View'}</h1>
                <iframe
                    width="100%"
                    height="500px"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube Video Player"
                ></iframe>
                
                {type === 'analysis' && (
                    <div className="analysisContent">
                        <h2>Analysis Tools</h2>
                        <p>Analysis specific content goes here.</p>
                    </div>
                )}

                {type === 'broadcasting' && (
                    <div className="broadcastingContent">
                        <h2>Broadcasting Controls</h2>
                        <p>Broadcasting specific content goes here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoViewer;
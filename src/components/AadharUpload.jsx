import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AadharUpload({ onExtractedData, disabled }) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            processFile(droppedFile);
        } else {
            setError('Please upload an image file (JPG, PNG)');
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = async (file) => {
        setFile(file);
        setError(null);
        setExtractedData(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Simulate OCR processing (replace with actual AWS Textract call)
        setIsProcessing(true);

        // Mock OCR result - In production, this would call AWS Textract
        setTimeout(() => {
            const mockData = {
                name: 'राजेश कुमार / RAJESH KUMAR',
                dob: '15/08/1985',
                gender: 'MALE / पुरुष',
                aadhar: '1234 5678 9012',
                address: '123, Main Street, Anand, Gujarat - 388001'
            };

            setExtractedData(mockData);
            setIsProcessing(false);

            if (onExtractedData) {
                onExtractedData(mockData);
            }
        }, 2000);
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setExtractedData(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="aadhar-upload-container">
            {/* Drop Zone */}
            <motion.div
                className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                whileHover={{ scale: file ? 1 : 1.02 }}
                animate={{
                    borderColor: isDragging ? '#6366f1' : file ? '#10b981' : 'rgba(255,255,255,0.1)'
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={disabled}
                />

                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="empty"
                            className="drop-zone-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="upload-icon">📷</div>
                            <h4>Upload Aadhar Card</h4>
                            <p>Drag & drop or click to browse</p>
                            <span className="supported-formats">JPG, PNG up to 5MB</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            className="file-preview"
                            initial={{ opacity: 0, rotateY: -90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: 90 }}
                            transition={{ type: 'spring', duration: 0.6 }}
                        >
                            <div className="preview-image-container">
                                <img src={preview} alt="Aadhar Preview" className="preview-image" />
                                {isProcessing && (
                                    <div className="processing-overlay">
                                        <div className="scanner-line" />
                                        <span>🔍 Scanning with AI...</span>
                                    </div>
                                )}
                            </div>
                            <button className="clear-btn" onClick={clearFile}>
                                ✕ Remove
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Extracted Data Display */}
            <AnimatePresence>
                {extractedData && (
                    <motion.div
                        className="extracted-data-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="extracted-header">
                            <span className="success-icon">✅</span>
                            <h4>Data Extracted Successfully!</h4>
                        </div>

                        <div className="extracted-fields">
                            <div className="field-row">
                                <span className="field-label">Name:</span>
                                <span className="field-value">{extractedData.name}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Aadhar:</span>
                                <span className="field-value aadhar-number">{extractedData.aadhar}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">DOB:</span>
                                <span className="field-value">{extractedData.dob}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Gender:</span>
                                <span className="field-value">{extractedData.gender}</span>
                            </div>
                            <div className="field-row">
                                <span className="field-label">Address:</span>
                                <span className="field-value">{extractedData.address}</span>
                            </div>
                        </div>

                        <p className="verify-note">
                            ⚡ This data will be auto-filled in your form
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Display */}
            {error && (
                <div className="upload-error">
                    <span>⚠️</span> {error}
                </div>
            )}
        </div>
    );
}

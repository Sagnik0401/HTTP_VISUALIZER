// PDF Viewer Implementation
class PDFViewer {
    constructor() {
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set up PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        this.initializeControls();
        this.loadPDF();
    }

    initializeControls() {
        // Previous page button
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.pageNum <= 1) return;
            this.pageNum--;
            this.queueRenderPage(this.pageNum);
        });

        // Next page button
        document.getElementById('nextPage').addEventListener('click', () => {
            if (this.pageNum >= this.pdfDoc.numPages) return;
            this.pageNum++;
            this.queueRenderPage(this.pageNum);
        });

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.scale += 0.25;
            if (this.scale > 3) this.scale = 3;
            this.queueRenderPage(this.pageNum);
            this.updateZoomDisplay();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.scale -= 0.25;
            if (this.scale < 0.5) this.scale = 0.5;
            this.queueRenderPage(this.pageNum);
            this.updateZoomDisplay();
        });
    }

    updateZoomDisplay() {
        document.getElementById('zoomLevel').textContent = 
            Math.round(this.scale * 100) + '%';
    }

    async loadPDF() {
        const loadingDiv = document.getElementById('pdfLoading');
        const errorDiv = document.getElementById('pdfError');
        
        try {
            // Load the PDF file
            const url = 'docs/Documentation-CNProjFinal.pdf';
            
            const loadingTask = pdfjsLib.getDocument(url);
            
            this.pdfDoc = await loadingTask.promise;
            
            // Update page info
            document.getElementById('totalPages').textContent = this.pdfDoc.numPages;
            
            // Hide loading, render first page
            loadingDiv.style.display = 'none';
            this.renderPage(this.pageNum);
            
            // Update button states
            this.updateButtons();
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            loadingDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    }

    renderPage(num) {
        this.pageRendering = true;
        
        // Get page
        this.pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale: this.scale });
            
            // Prepare canvas using PDF page dimensions
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            const renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(() => {
                this.pageRendering = false;
                if (this.pageNumPending !== null) {
                    // New page rendering is pending
                    this.renderPage(this.pageNumPending);
                    this.pageNumPending = null;
                }
            });
        });

        // Update page counter
        document.getElementById('currentPage').textContent = num;
        this.updateButtons();
    }

    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    }

    updateButtons() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (!this.pdfDoc) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        
        prevBtn.disabled = this.pageNum <= 1;
        nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages;
    }
}

// Initialize PDF viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const pdfViewer = new PDFViewer();
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && pdfViewer.pageNum > 1) {
            document.getElementById('prevPage').click();
        } else if (e.key === 'ArrowRight' && 
                   pdfViewer.pageNum < pdfViewer.pdfDoc?.numPages) {
            document.getElementById('nextPage').click();
        }
    });

    // Smooth scroll to top on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
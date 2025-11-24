class GlobalScanData {
  Portrait_Image: string = '';
  Document_Image: string = '';
  Name: string = '';

  setPortrait(base64: string) {
    this.Portrait_Image = base64;
  }

  setDocument(base64: string) {
    this.Document_Image = base64;
  }

  setName(base64: string) {
    this.Name = base64;
  }

  clear() {
    this.Portrait_Image = '';
    this.Document_Image = '';
    this.Name = '';
  }
}

const ScanData = new GlobalScanData(); 
export default ScanData;

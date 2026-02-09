
export interface ScaleBarcodeResult {
  plu: string;
  weight?: number; // In Kg
  price?: number;
}

export const BarcodeParser = {
  // Support standard 13-digit scale barcodes
  // Format: PP IIIII WWWWW C
  // PP: Prefix (29, 99, 27)
  // IIIII: Item Code (PLU)
  // WWWWW: Weight/Price
  // C: Checksum
  parseScaleBarcode(barcode: string): ScaleBarcodeResult | null {
    if (!barcode || barcode.length !== 13) return null;

    // Check for common scale prefixes
    const prefix = barcode.substring(0, 2);
    if (!['29', '27', '99', '22'].includes(prefix)) return null;

    // Default implementation assumes "Price Embedded" or "Weight Embedded"
    // Commonly: 29 PPPP WWWWW C (Weight in grams)
    
    const plu = barcode.substring(2, 7);
    const valuePart = barcode.substring(7, 12);
    const valueRaw = parseInt(valuePart, 10);
    
    // Heuristic: If it starts with 29, usually it's weight in grams (3 decimals)
    const weight = valueRaw / 1000;

    return {
      plu,
      weight
    };
  }
};

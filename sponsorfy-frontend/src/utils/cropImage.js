import Cropper from "cropperjs";

export default async function getCroppedImg(imageSrc, cropAreaPixels) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = cropAreaPixels.width;
      canvas.height = cropAreaPixels.height;

      ctx.drawImage(img, cropAreaPixels.x, cropAreaPixels.y, cropAreaPixels.width, cropAreaPixels.height, 0, 0, cropAreaPixels.width, cropAreaPixels.height);
      resolve(canvas.toDataURL());
    };
  });
}
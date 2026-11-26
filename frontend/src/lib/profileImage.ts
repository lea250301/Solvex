export async function prepareProfileImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Izberi PNG, JPEG ali WebP fotografijo.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Fotografija naj bo manjša od 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Brskalnik ne omogoča priprave fotografije.')
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    if (!side) throw new Error('Fotografije ni mogoče odpreti.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, 256, 256)
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 256, 256)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch (error) {
    throw new Error(error instanceof Error && error.message.includes('Brskalnik') ? error.message : 'Fotografije ni mogoče odpreti. Izberi drugo datoteko.', { cause: error })
  } finally {
    URL.revokeObjectURL(url)
  }
}

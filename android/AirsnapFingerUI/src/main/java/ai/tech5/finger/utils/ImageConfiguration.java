 package ai.tech5.finger.utils;


 import android.os.Parcel;
 import android.os.Parcelable;

 public class ImageConfiguration implements Parcelable {





   private ImageType  primaryImageType          = ImageType.IMAGE_TYPE_WSQ;

   private ImageType displayImageType = ImageType.IMAGE_TYPE_PNG;

   private boolean requireDisplayImage = false;
   private float   compressionRatio    = 10.0F;
   private boolean   cropImage           = true;
   private int       croppedImageWidth   = 512;
   private int       croppedImageHeight  = 512;
   private int       paddingColor       = 255;


   public float getCompressionRatio() {
     return this.compressionRatio;
   }

   public void setCompressionRatio(float compressionRatio) {
     this.compressionRatio = compressionRatio;
   }

   public int getCroppedImageWidth() {
     return this.croppedImageWidth;
   }

   public void setCroppedImageWidth(int croppedImageWidth) {
     this.croppedImageWidth = croppedImageWidth;
   }

   public int getCroppedImageHeight() {
     return this.croppedImageHeight;
   }

   public void setCroppedImageHeight(int croppedImageHeight) {
     this.croppedImageHeight = croppedImageHeight;
   }

   public int getPaddingColor() {
     return this.paddingColor;
   }

   public void setPaddingColor(int paddingColor) {
     this.paddingColor = paddingColor;
   }

   public boolean isCropImage() {
     return cropImage;
   }

   public void setIsCropImage(boolean cropImage) {
     this.cropImage = cropImage;
   }

   public ImageType getDisplayImageType() {
     return displayImageType;
   }

   public void setDisplayImageType(ImageType displayImageType) {
     this.displayImageType = displayImageType;
   }

   public boolean isRequireDisplayImage() {
     return requireDisplayImage;
   }

   public void setRequireDisplayImage(boolean requireDisplayImage) {
     this.requireDisplayImage = requireDisplayImage;
   }

//   public void setCropImage(boolean cropImage) {
//     this.cropImage = cropImage;
//   }



   public ImageType getPrimaryImageType() {
     return primaryImageType;
   }

   public void setPrimaryImageType(ImageType primaryImageType) {
     this.primaryImageType = primaryImageType;
   }


   @Override
   public int describeContents() {
     return 0;
   }

   @Override
   public void writeToParcel(Parcel dest, int flags) {
     dest.writeInt(this.primaryImageType == null ? -1 : this.primaryImageType.ordinal());
     dest.writeFloat(this.compressionRatio);
     dest.writeByte(this.cropImage ? (byte) 1 : (byte) 0);
     dest.writeInt(this.croppedImageWidth);
     dest.writeInt(this.croppedImageHeight);
     dest.writeInt(this.paddingColor);
     dest.writeInt(this.displayImageType == null ? -1 : this.displayImageType.ordinal());
     dest.writeByte(this.requireDisplayImage ? (byte) 1 : (byte) 0);
   }

   public void readFromParcel(Parcel source) {
     int tmpPrimaryImageType = source.readInt();
     this.primaryImageType = tmpPrimaryImageType == -1 ? null : ImageType.values()[tmpPrimaryImageType];
     this.compressionRatio = source.readFloat();
     this.cropImage = source.readByte() != 0;
     this.croppedImageWidth = source.readInt();
     this.croppedImageHeight = source.readInt();
     this.paddingColor = source.readInt();
     int tmpDisplayImageType = source.readInt();
     this.displayImageType = tmpDisplayImageType == -1 ? null : ImageType.values()[tmpDisplayImageType];
     this.requireDisplayImage = source.readByte() != 0;
   }

   public ImageConfiguration() {
   }

   protected ImageConfiguration(Parcel in) {
     int tmpPrimaryImageType = in.readInt();
     this.primaryImageType = tmpPrimaryImageType == -1 ? null : ImageType.values()[tmpPrimaryImageType];
     this.compressionRatio = in.readFloat();
     this.cropImage = in.readByte() != 0;
     this.croppedImageWidth = in.readInt();
     this.croppedImageHeight = in.readInt();
     this.paddingColor = in.readInt();
     int tmpDisplayImageType = in.readInt();
     this.displayImageType = tmpDisplayImageType == -1 ? null : ImageType.values()[tmpDisplayImageType];
     this.requireDisplayImage = in.readByte() != 0;
   }

   public static final Creator<ImageConfiguration> CREATOR = new Creator<ImageConfiguration>() {
     @Override
     public ImageConfiguration createFromParcel(Parcel source) {
       return new ImageConfiguration(source);
     }

     @Override
     public ImageConfiguration[] newArray(int size) {
       return new ImageConfiguration[size];
     }
   };
 }

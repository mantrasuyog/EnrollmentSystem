package ai.tech5.finger.utils;

import android.os.Parcel;
import android.os.Parcelable;

public class LivenessScore implements Parcelable {
    public int pos;
    public float score;


    public LivenessScore(int pos, float livenessScore) {
        this.pos = pos;
        this.score = livenessScore;
    }


    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(this.pos);
        dest.writeFloat(this.score);
    }

    public void readFromParcel(Parcel source) {
        this.pos = source.readInt();
        this.score = source.readFloat();
    }

    protected LivenessScore(Parcel in) {
        this.pos = in.readInt();
        this.score = in.readFloat();
    }

    public static final Creator<LivenessScore> CREATOR = new Creator<LivenessScore>() {
        @Override
        public LivenessScore createFromParcel(Parcel source) {
            return new LivenessScore(source);
        }

        @Override
        public LivenessScore[] newArray(int size) {
            return new LivenessScore[size];
        }
    };
}

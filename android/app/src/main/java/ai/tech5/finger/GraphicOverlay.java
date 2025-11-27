package ai.tech5.finger;

import com.enrollmentsystem.R;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.ArrayList;

import ai.tech5.sdk.abis.T5AirSnap.SgmRectImage;


public class GraphicOverlay extends View
{
    private final Paint m_borderPaint;
    private Rect  m_borderRect    = null;
    private final Paint m_boundBoxPaint;

    private final ArrayList<SgmRectImage> m_rectangles = new ArrayList<SgmRectImage>();

    public GraphicOverlay(Context context, @Nullable AttributeSet attrs)
    {
        super(context, attrs);

        m_borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        m_borderPaint.setStyle(Paint.Style.STROKE);

        m_boundBoxPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        m_boundBoxPaint.setStyle(Paint.Style.STROKE);
        m_boundBoxPaint.setColor(getResources().getColor(R.color.bounding_boxes_border_color));
    }

    public void init(Rect borderRect)
    {
        int squareWidth = (borderRect.width() + borderRect.height()) / 2;

        m_borderPaint.setStrokeWidth(0.02f * squareWidth);
        m_boundBoxPaint.setStrokeWidth(0.01f * squareWidth);

        m_borderRect = borderRect;
    }

    @Override
    protected void onDraw(@NonNull Canvas canvas)
    {
        super.onDraw(canvas);

        if (m_borderRect == null)
        {
            return;
        }

        float fingersDistance = 0.0f;

        for (int i = 0; i < m_rectangles.size(); i++)
        {

            SgmRectImage rectangle = m_rectangles.get(i);

            fingersDistance += rectangle.distance;

            float  x0 = rectangle.coords[0][0];
            float  y0 = rectangle.coords[0][1];
            double dx = rectangle.coords[1][0] - x0;
            double dy = rectangle.coords[1][1] - y0;

            float  angle    = (float)(Math.atan2(dy, dx) * 180.0 / Math.PI);
            float  distance = (float)Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

            canvas.rotate(angle, x0, y0);


            if (rectangle.focused)
            {
                m_boundBoxPaint.setStyle(Paint.Style.FILL);
                m_boundBoxPaint.setColor(getResources().getColor(R.color.bounding_boxes_fill_color));
            }
            else
            {
                m_boundBoxPaint.setStyle(Paint.Style.STROKE);
                m_boundBoxPaint.setColor(getResources().getColor(R.color.bounding_boxes_border_color));
            }

            canvas.drawOval((x0 - distance), (y0 - 0.6f * distance),
                            (x0 + distance), (y0 + 0.6f * distance),
                            m_boundBoxPaint);

            canvas.rotate(-angle, x0, y0);
        }

        canvas.drawRect(m_borderRect, m_borderPaint);


        m_boundBoxPaint.setStyle(Paint.Style.FILL);
        m_boundBoxPaint.setColor(0x80000000);

        float left   = 0.0f;
        float top    = 0.35f * this.getHeight();
        float right  = 0.1f  * this.getWidth();
        float bottom = 0.65f * this.getHeight();

        canvas.drawRect(left, top, right, bottom, m_boundBoxPaint);

        float linesAreaHeight = 0.9f * (bottom - top);

        for (int i = 0; i <= 10; i++)
        {
            if      ((i == 0) || (i == 10))  m_boundBoxPaint.setColor(0x60FF0000);
            else if ((i <  3) || (i >  7 ))  m_boundBoxPaint.setColor(0x60FFFF00);
            else                             m_boundBoxPaint.setColor(0x6000FF00);

            canvas.drawLine(0.55f * right, top + 0.05f * (bottom - top) + i * linesAreaHeight / 10.0f,
                    0.9f  * right, top + 0.05f * (bottom - top) + i * linesAreaHeight / 10.0f,
                    m_boundBoxPaint);
        }

        m_boundBoxPaint.setColor(0xFFFFFFFF);

        if (!m_rectangles.isEmpty())
        {
            fingersDistance /= m_rectangles.size();

            canvas.drawLine(0.1f  * right, top + 0.05f * (bottom - top) + (1.0f - fingersDistance) * linesAreaHeight,
                    0.45f * right, top + 0.05f * (bottom - top) + (1.0f - fingersDistance) * linesAreaHeight,
                    m_boundBoxPaint);
        }
    }

    public void drawBorderAndBoundBoxes(int color, ArrayList<SgmRectImage> rectangles)
    {
        m_borderPaint.setColor(color);

        m_rectangles.clear();
        m_rectangles.addAll(rectangles);

        invalidate();
    }
}

package com.eventflow.modules.ticket;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import org.springframework.stereotype.Component;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Component
public class TicketPdf {
    public byte[] render(Ticket ticket) {
        try {
            var result = new ByteArrayOutputStream();
            try (var document = new Document(new PdfDocument(new PdfWriter(result)))) {
                var event = ticket.getBooking().getEvent();
                var seat = ticket.getEventSeat().getSeat();
                document.add(new Paragraph("EVENTFLOW  /  ADMISSION").setBold().setFontSize(12));
                document.add(new Paragraph(event.getTitle()).setBold().setFontSize(26));
                document.add(new Paragraph(event.getEventDate().format(DateTimeFormatter.ofPattern("dd MMM uuuu, HH:mm"))));
                document.add(new Paragraph(event.getVenue().getName()));
                document.add(new Paragraph("Row " + seat.getRowLabel() + "  /  Seat " + seat.getSeatNumber()));
                document.add(new Paragraph(ticket.getTicketCode()).setBold());
                var qr = new ByteArrayOutputStream();
                MatrixToImageWriter.writeToStream(new QRCodeWriter().encode(ticket.getTicketCode(), BarcodeFormat.QR_CODE, 240, 240), "PNG", qr);
                document.add(new Image(ImageDataFactory.create(qr.toByteArray())).scaleToFit(150, 150));
                document.add(new Paragraph("Present this QR code at the venue."));
            }
            return result.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Ticket PDF could not be generated", exception);
        }
    }
}

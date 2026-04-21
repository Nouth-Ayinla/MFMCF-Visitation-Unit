import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  TextRun, 
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

interface FirstTimerForExport {
  full_name: string;
  phone_number: string | null;
  departments?: { name: string } | null;
  levels?: { level_number: string } | null;
  registered_at?: string | null;
  contacted_at?: string | null;
  promoted_to_member_at?: string | null;
  follow_up_notes?: string | null;
}

const SERVICE_TYPES = {
  tuesday: 'Bible Study',
  thursday: 'Revival Hour',
  sunday: 'Sunday Service'
} as const;

export type ServiceDay = keyof typeof SERVICE_TYPES;

export const getServiceTypeName = (day: ServiceDay): string => {
  return SERVICE_TYPES[day];
};

export const generateFirstTimerDoc = async (
  firstTimers: FirstTimerForExport[], 
  serviceDay: ServiceDay,
  date: Date
): Promise<void> => {
  const serviceTypeName = getServiceTypeName(serviceDay);
  const formattedDate = format(date, 'MMMM d, yyyy');
  const fileDate = format(date, 'yyyy-MM-dd');

  // Create table rows
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'S/N', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 5, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Full Name', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 30, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Phone Number', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 25, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Department', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 25, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Level', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 15, type: WidthType.PERCENTAGE }
      }),
    ],
  });

  const dataRows = firstTimers.map((member, index) => 
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: String(index + 1) })],
            alignment: AlignmentType.CENTER
          })],
        }),
        new TableCell({
          children: [new Paragraph({ text: member.full_name || '' })],
        }),
        new TableCell({
          children: [new Paragraph({ text: member.phone_number || 'N/A' })],
        }),
        new TableCell({
          children: [new Paragraph({ text: member.departments?.name || 'N/A' })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: member.levels?.level_number || 'N/A' })],
            alignment: AlignmentType.CENTER
          })],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ 
            text: 'MFM Campus Fellowship - FUTA Chapter',
            bold: true,
            size: 32
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: 'First Timers List',
            bold: true,
            size: 28
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: `Service: ${serviceTypeName}`,
            size: 24
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: `Date: ${formattedDate}`,
            size: 24
          })],
          spacing: { after: 300 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: `Total First Timers: ${firstTimers.length}`,
            bold: true,
            size: 22
          })],
          spacing: { after: 200 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `FirstTimers_${serviceTypeName.replace(/\s+/g, '')}_${fileDate}.docx`;
  saveAs(blob, fileName);
};

export const generateAllFirstTimersDoc = async (
  firstTimers: FirstTimerForExport[]
): Promise<void> => {
  const exportDate = format(new Date(), 'MMMM d, yyyy');
  const fileDate = format(new Date(), 'yyyy-MM-dd');

  // Create table rows
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'S/N', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 4, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Full Name', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 20, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Phone Number', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 18, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Department', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 16, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Level', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 10, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Registered', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 14, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: 'Status', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        width: { size: 18, type: WidthType.PERCENTAGE }
      }),
    ],
  });

  const dataRows = firstTimers.map((member, index) => {
    let status = 'Active';
    if (member.promoted_to_member_at) {
      status = 'Promoted';
    } else if (member.contacted_at) {
      status = 'Contacted';
    }

    const registeredDate = member.registered_at 
      ? format(new Date(member.registered_at), 'MMM d, yyyy')
      : 'N/A';

    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: String(index + 1) })],
            alignment: AlignmentType.CENTER
          })],
        }),
        new TableCell({
          children: [new Paragraph({ text: member.full_name || '' })],
        }),
        new TableCell({
          children: [new Paragraph({ text: member.phone_number || 'N/A' })],
        }),
        new TableCell({
          children: [new Paragraph({ text: member.departments?.name || 'N/A' })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: member.levels?.level_number || 'N/A' })],
            alignment: AlignmentType.CENTER
          })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: registeredDate })],
            alignment: AlignmentType.CENTER,
            size: 18
          })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: status })],
            alignment: AlignmentType.CENTER
          })],
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ 
            text: 'MFM Campus Fellowship - FUTA Chapter',
            bold: true,
            size: 32
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: 'Comprehensive First Timers Report',
            bold: true,
            size: 28
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: `Generated: ${exportDate}`,
            italic: true,
            size: 20
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: `Total First Timers: ${firstTimers.length}`,
            bold: true,
            size: 22
          })],
          spacing: { after: 200 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { before: 300 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: 'Report Legend',
            bold: true,
            size: 24
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: '• Active: First timer who has not yet been promoted or contacted',
            size: 20
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: '• Contacted: First timer who has been contacted but not promoted',
            size: 20
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ 
            text: '• Promoted: First timer who has been promoted to full member',
            size: 20
          })],
          spacing: { after: 100 }
        }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `AllFirstTimers_Report_${fileDate}.docx`;
  saveAs(blob, fileName);
};

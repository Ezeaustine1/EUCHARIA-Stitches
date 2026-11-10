import React, { useState } from 'react';
import { BRAND_IMAGES } from '../data/initialData.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { Sparkles, Check, Scissors, Info } from 'lucide-react';

export interface FabricGuideItem {
  id: string;
  name: string;
  originOrType: string;
  imageUrl: string;
  careGuide: string;
  usageGuide: string;
  suitability: string[];
  recommendedCategory: string;
}

export const FABRIC_LIBRARY_ITEMS: FabricGuideItem[] = [
  {
    id: 'fab-1',
    name: 'Hand-Woven Aso-Oke',
    originOrType: 'Heritage Yoruba Loom Textile',
    imageUrl: BRAND_IMAGES.heroCouture,
    careGuide:
      'Specialist dry clean only. Never machine wash or wring. Store flat in breathable muslin cloth away from direct humidity.',
    usageGuide:
      'Prized for traditional marriages, royal chieftaincy installations, Iro & Buba sets, structured corsets, and matching Auto-Gele.',
    suitability: ['Traditional Engagement', 'Bridal Iro & Buba', 'Structured Corset', 'Auto-Gele'],
    recommendedCategory: 'Native and Traditional Wear',
  },
  {
    id: 'fab-2',
    name: 'French & Chantilly Lace',
    originOrType: 'Fine Filigree Mesh Couture Lace',
    imageUrl: BRAND_IMAGES.bridalCouture,
    careGuide:
      'Delicate hand soak in cool water or luxury dry clean. Steam gently on low heat using a pressing cloth; avoid sharp jewelry snags.',
    usageGuide:
      'Creates ethereal illusion necklines, sheer sleeves, layered bridal skirts, and high-fashion Aso-Ebi reception silhouettes.',
    suitability: ['Bridal Gowns', 'Illusion Bodices', 'Aso-Ebi Reception', 'Dinner Gowns'],
    recommendedCategory: 'Bridal Reception Outfits',
  },
  {
    id: 'fab-3',
    name: 'Guipure & Cord Lace',
    originOrType: 'Heavy Relief Embroidered Lace',
    imageUrl: BRAND_IMAGES.asoEbiLace,
    careGuide:
      'Spot clean beaded sections; press strictly from the reverse side over a padded ironing board to preserve raised cord relief.',
    usageGuide:
      'Holds sculpted mermaid hems, contoured peplum waists, and regal six-piece traditional skirts without losing form.',
    suitability: ['Mermaid Aso-Ebi', 'Six-Piece Skirts', 'Beaded Corsets', 'Mother-of-the-Bride'],
    recommendedCategory: 'Lace Outfits',
  },
  {
    id: 'fab-4',
    name: 'Nigerian Ankara Wax Print',
    originOrType: '100% Cotton Vibrant Batik Wax',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
    careGuide:
      'Wash in cool water with mild soap to preserve dye vibrancy. Iron on reverse side while slightly damp.',
    usageGuide:
      'Versatile everyday and occasion textile ideal for architectural blazer dresses, corporate pencil skirts, and flared midi gowns.',
    suitability: ['Blazer Dresses', 'Corporate Sets', 'Peplum Tops', 'Children’s Matching Sets'],
    recommendedCategory: 'Ankara Styles',
  },
  {
    id: 'fab-5',
    name: 'Adire Silk & Hand-Dyed Crepe',
    originOrType: 'Artisanal Resist-Dyed Silk Blend',
    imageUrl: BRAND_IMAGES.atelierStudio,
    careGuide:
      'Hand wash separately in cold water with pH-neutral detergent. Drip dry in the shade and steam lightly.',
    usageGuide:
      'Celebrated for fluid movement and cooling breathability in luxury boubous, kaftans, kimono sets, and resort dinner wear.',
    suitability: ['Rich-Aunty Boubou', 'Silk Kaftans', 'Palazzo Sets', 'Casual Luxury'],
    recommendedCategory: 'Casual Wear',
  },
  {
    id: 'fab-6',
    name: 'Bridal Mikado & Duchess Satin',
    originOrType: 'Lustrous Heavyweight Couture Silk',
    imageUrl: BRAND_IMAGES.bridalCouture,
    careGuide:
      'Professional bridal dry clean only. Use distilled water in steamers to prevent water-spot rings; hang on padded hangers.',
    usageGuide:
      'Provides dramatic architectural volume for cathedral bridal trains, pleated ballgowns, and detachable overskirts.',
    suitability: ['Cathedral Wedding Dresses', 'Ballgowns', 'Detachable Overskirts', 'Structured Bows'],
    recommendedCategory: 'Wedding Dresses',
  },
  {
    id: 'fab-7',
    name: 'Executive Suiting Crepe',
    originOrType: 'Wrinkle-Resistant Matte Tailoring Weave',
    imageUrl: BRAND_IMAGES.ankaraContemporary,
    careGuide:
      'Dry clean or gentle cold cycle. Steam or press with a medium-warm iron using a protective pressing cloth.',
    usageGuide:
      'Engineered for all-day boardroom poise, sharp lapel blazers, high-waisted trousers, and contoured sheath dresses.',
    suitability: ['Executive Suits', 'Pencil Dresses', 'Tailored Jumpsuits', 'Office Wear'],
    recommendedCategory: 'Corporate Wear',
  },
  {
    id: 'fab-8',
    name: '3D Beaded Couture Tulle',
    originOrType: 'Hand-Embellished Crystal & Pearl Netting',
    imageUrl: BRAND_IMAGES.heroCouture,
    careGuide:
      'Never machine wash or iron directly on beads. Spot clean delicately and store flat in a garment bag to avoid stretching.',
    usageGuide:
      'Used for red-carpet dinner gowns, high-glamour birthday dresses, and statement bridal reception corsetry.',
    suitability: ['Red-Carpet Gowns', 'Milestone Birthday', 'Bridal Second-Look', 'Gala Wear'],
    recommendedCategory: 'Party and Dinner Dresses',
  },
  {
    id: 'fab-9',
    name: 'Velvet & George Wrapper',
    originOrType: 'Plush Gold-Thread Embroidered Textile',
    imageUrl: BRAND_IMAGES.asoEbiLace,
    careGuide:
      'Never flatten velvet pile with a hot iron; steam lightly from the reverse side and brush gently along the nap.',
    usageGuide:
      'Traditional southeastern and southern Nigerian ceremonial wrapper sets, regal evening gowns, and bridal train attire.',
    suitability: ['Traditional Bridal', 'George Wrapper & Blouse', 'Evening Gowns', 'Cultural Attire'],
    recommendedCategory: 'Native and Traditional Wear',
  },
  {
    id: 'fab-10',
    name: 'Soft Cotton-Lined Organza',
    originOrType: 'Sheer Crisp Silk-Organza with Breathable Lining',
    imageUrl: BRAND_IMAGES.bridalCouture,
    careGuide:
      'Gentle hand wash in lukewarm water. Steam at low temperature to restore crisp puff sleeves and tiered ruffles.',
    usageGuide:
      'Ideal for sculptural puff sleeves, children’s celebratory party dresses, flower-girl gowns, and statement collars.',
    suitability: ['Children’s Party Dresses', 'Flower-Girl Gowns', 'Sculptural Sleeves', 'Layered Ruffles'],
    recommendedCategory: "Children's Clothing",
  },
];

interface FabricLibraryProps {
  onSelectCategoryFilter: (category: string) => void;
  onBookWithFabric: (fabricName: string, category: string) => void;
}

export const FabricLibrary: React.FC<FabricLibraryProps> = ({
  onSelectCategoryFilter,
  onBookWithFabric,
}) => {
  const [selectedFabric, setSelectedFabric] = useState<FabricGuideItem>(FABRIC_LIBRARY_ITEMS[0]);

  return (
    <div className="mt-14 pt-12 border-t border-[#E6DEC8]" id="fabric-library">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#9E7B36] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Atelier Textile Guide · Care, Usage & Garment Suitability</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1A1412] mt-1">
            The EUCHARIA Stitches Fabric Library
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4E47] mt-1.5 max-w-2xl leading-relaxed">
            Explore our curated guide to premier Nigerian and couture textiles—from hand-woven
            Aso-Oke and French Chantilly Lace to vibrant Ankara wax prints. Click any fabric below
            to view its care instructions, ideal garment styles, or commission an outfit.
          </p>
        </div>
        <button
          onClick={() =>
            onBookWithFabric(selectedFabric.name, selectedFabric.recommendedCategory)
          }
          className="px-5 py-2.5 bg-[#1A1412] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
        >
          Book Outfit with {selectedFabric.name}
        </button>
      </div>

      {/* Selected Fabric Deep-Dive Spotlight Bar */}
      <div className="bg-white border border-[#C5A059] rounded-2xl p-6 mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-3 h-48 rounded-xl overflow-hidden border border-[#E6DEC8]">
          <ResilientImage
            src={selectedFabric.imageUrl}
            alt={selectedFabric.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="lg:col-span-9 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DEC8] pb-3">
            <div>
              <p className="text-xs text-[#9E7B36] font-medium">
                {selectedFabric.originOrType} · Recommended for {selectedFabric.recommendedCategory}
              </p>
              <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1412]">
                {selectedFabric.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectCategoryFilter(selectedFabric.recommendedCategory)}
                className="px-3.5 py-2 border border-[#E6DEC8] text-[#1A1412] hover:bg-[#F5EFE6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Filter {selectedFabric.recommendedCategory}
              </button>
              <button
                onClick={() =>
                  onBookWithFabric(selectedFabric.name, selectedFabric.recommendedCategory)
                }
                className="px-4 py-2 bg-[#1A1412] text-[#FAF7F2] hover:bg-[#2C211D] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Select Fabric for Booking
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E6DEC8]">
              <p className="font-semibold text-[#1A1412] flex items-center gap-1.5 mb-1">
                <Scissors className="w-3.5 h-3.5 text-[#9E7B36]" />
                Usage & Occasion Guide
              </p>
              <p className="text-[#5C4E47] leading-relaxed">{selectedFabric.usageGuide}</p>
            </div>
            <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E6DEC8]">
              <p className="font-semibold text-[#1A1412] flex items-center gap-1.5 mb-1">
                <Info className="w-3.5 h-3.5 text-[#9E7B36]" />
                Fabric Care & Maintenance
              </p>
              <p className="text-[#5C4E47] leading-relaxed">{selectedFabric.careGuide}</p>
            </div>
            <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E6DEC8]">
              <p className="font-semibold text-[#1A1412] flex items-center gap-1.5 mb-1">
                <Check className="w-3.5 h-3.5 text-[#9E7B36]" />
                Best Garment Styles
              </p>
              <p className="text-[#5C4E47] leading-relaxed">
                {selectedFabric.suitability.join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5-in-a-Row Professional Fabric Showcase Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {FABRIC_LIBRARY_ITEMS.map((fabric) => {
          const isSelected = selectedFabric.id === fabric.id;
          return (
            <div
              key={fabric.id}
              onClick={() => setSelectedFabric(fabric)}
              className={`cursor-pointer bg-white rounded-xl overflow-hidden border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 -translate-y-0.5'
                  : 'border-[#E6DEC8] hover:border-[#C5A059]/70'
              }`}
            >
              <div>
                <div className="h-36 w-full overflow-hidden bg-[#F5EFE6]">
                  <ResilientImage
                    src={fabric.imageUrl}
                    alt={fabric.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3.5">
                  <p className="text-[11px] text-[#9E7B36] font-medium truncate">
                    {fabric.originOrType}
                  </p>
                  <h4 className="font-serif-display text-lg font-semibold text-[#1A1412] mt-0.5 leading-snug">
                    {fabric.name}
                  </h4>
                  <p className="text-[11px] text-[#5C4E47] mt-1.5 line-clamp-2 leading-relaxed">
                    <strong>Care:</strong> {fabric.careGuide}
                  </p>
                  <p className="text-[11px] text-[#1A1412] mt-1.5 truncate">
                    <strong>Styles:</strong> {fabric.suitability.slice(0, 2).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="px-3.5 pb-3.5 pt-2 border-t border-[#E6DEC8] flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#9E7B36]">
                  {isSelected ? 'Viewing Guide' : 'View Care Guide'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookWithFabric(fabric.name, fabric.recommendedCategory);
                  }}
                  className="px-2.5 py-1 bg-[#1A1412] text-[#FAF7F2] text-[11px] font-medium rounded hover:bg-[#2C211D] transition-colors whitespace-nowrap shrink-0"
                >
                  Use Fabric
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

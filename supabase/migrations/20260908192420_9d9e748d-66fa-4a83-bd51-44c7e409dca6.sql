CREATE TABLE public.destination_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  intro TEXT NOT NULL DEFAULT '',
  coverage TEXT NOT NULL DEFAULT '',
  capital TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT '',
  languages TEXT NOT NULL DEFAULT '',
  power_plug TEXT NOT NULL DEFAULT '',
  emergency_number TEXT NOT NULL DEFAULT '',
  best_time TEXT NOT NULL DEFAULT '',
  tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  local_faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.destination_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.destination_content TO authenticated;
GRANT ALL ON public.destination_content TO service_role;

ALTER TABLE public.destination_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published destination guides are public"
ON public.destination_content FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Supplier admins manage destination guides"
ON public.destination_content FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'supplier_admin'))
WITH CHECK (public.has_role(auth.uid(), 'supplier_admin'));

CREATE TRIGGER update_destination_content_updated_at
BEFORE UPDATE ON public.destination_content
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

INSERT INTO public.destination_content (slug, country, intro, coverage, capital, currency, languages, power_plug, emergency_number, best_time, tips, local_faqs) VALUES
('ghana','Ghana','Ghana rewards travellers who stay connected: ride-hailing in Accra, mobile money confirmations, and directions along the coast road to Cape Coast all depend on data. A Weettah eSIM is live the moment you land at Kotoka International, so you can order a car or message your host before you reach the arrivals hall.','Your eSIM connects to leading Ghanaian mobile networks including MTN, Telecel and AirtelTigo, with strong 4G across Accra, Kumasi, Takoradi and the coastal corridor. Coverage thins in parts of the far north and inside the Volta hills.','Accra','Ghanaian cedi (GHS)','English (official), Twi, Ga, Ewe','Types D and G, 230V','112 (general), 191 (police)','November to March, during the dry Harmattan season',
'["Agree a fare or use a ride-hailing app in Accra rather than hailing at the roadside.","Carry small cedi notes: many trotro and market traders do not take cards.","Bottled or sachet water is the norm; keep some in the car on long drives."]',
'[{"q":"Will my Weettah eSIM work as soon as I land in Accra?","a":"Yes. Install it before you fly and switch data roaming on for the Weettah line once you land — it registers on a Ghanaian network within a minute or two."},{"q":"Can I use mobile money with my eSIM?","a":"Mobile money apps and USSD run on your local account, not on data alone. Keep your usual SIM in the phone for USSD codes and use the Weettah line for internet."},{"q":"Is there coverage outside Accra?","a":"Yes, across Kumasi, Takoradi, Tamale and the main highways. Expect slower speeds in remote northern districts."}]'),
('kenya','Kenya','From matatu-jammed Nairobi mornings to a sundowner in the Mara, Kenya runs on mobile. Travellers use data for maps, safari bookings, and staying in touch across long transfers. A Weettah eSIM keeps you online from the moment you clear Jomo Kenyatta International.','Your eSIM connects to leading Kenyan networks including Safaricom, Airtel and Telkom. 4G is excellent in Nairobi, Mombasa, Kisumu and Nakuru, and reaches most safari lodges in the Maasai Mara and Amboseli, though game drives can drop to 3G or no signal in valleys.','Nairobi','Kenyan shilling (KES)','Swahili and English','Type G, 240V','999 or 112','June to October and January to February for wildlife viewing',
'["Download offline maps before a safari — signal disappears inside the conservancies.","Park entry fees are increasingly cashless, so keep a card that works online.","Nairobi traffic is heavy; leave early for airport transfers."]',
'[{"q":"Will the eSIM work on safari in the Maasai Mara?","a":"Around most camps and lodges, yes. Deep inside the reserve you may lose signal entirely — download maps and confirmations in advance."},{"q":"Can I still use M-PESA?","a":"M-PESA is tied to your Safaricom line, not to travel data. Keep that SIM active if you use it, and let Weettah handle your internet."},{"q":"How fast is data in Nairobi?","a":"You should see solid 4G across the city, fast enough for video calls and ride-hailing."}]'),
('nigeria','Nigeria','Lagos moves fast, and so does everything you need to arrange there — rides, meetings, transfers, and directions that change with the traffic. A Weettah eSIM gets you online at Murtala Muhammed or Nnamdi Azikiwe before you join the queue outside.','Your eSIM connects to leading Nigerian networks including MTN, Airtel, Glo and 9mobile, with dependable 4G in Lagos, Abuja, Port Harcourt, Ibadan and Kano. Rural coverage varies and can fall back to 3G.','Abuja','Nigerian naira (NGN)','English (official), Hausa, Yoruba, Igbo','Types D and G, 230V','112','November to March, in the dry season',
'["Use a ride-hailing app in Lagos and Abuja rather than negotiating at the kerb.","Traffic on the Lagos mainland-island route can add hours; plan flights with room to spare.","Power cuts are common — travel with a charged power bank."]',
'[{"q":"Which network will my eSIM use in Lagos?","a":"It selects the strongest available partner network automatically, so you do not have to choose."},{"q":"Can I hotspot to a laptop?","a":"Yes, tethering works on your Weettah plan just like normal mobile data."},{"q":"Will I keep my WhatsApp number?","a":"Yes. WhatsApp stays tied to your usual number; the eSIM only carries data."}]'),
('south-africa','South Africa','Cape Town road trips, Johannesburg business days, and the long stretch of the Garden Route all go smoother with data in your pocket. A Weettah eSIM connects on arrival at OR Tambo, Cape Town International or King Shaka, no queueing for a local SIM and no passport paperwork.','Your eSIM connects to leading South African networks including Vodacom, MTN, Cell C and Telkom. 4G and 5G are widely available in Johannesburg, Pretoria, Cape Town and Durban; coverage follows the main routes through the Karoo and Drakensberg with gaps in between.','Pretoria (executive capital)','South African rand (ZAR)','11 official languages, with English widely spoken','Types M, N and C, 230V','10111 (police), 112 from a mobile','October to April for the coast, May to September for game viewing',
'["Load navigation before driving the Karoo — long stretches have no signal.","Load shedding can knock out local Wi-Fi; mobile data is the reliable fallback.","Distances are bigger than they look; Cape Town to the Garden Route is a full day."]',
'[{"q":"Do I get 5G with a Weettah eSIM?","a":"Where the partner network offers 5G and your phone supports it, yes — otherwise you fall back to 4G."},{"q":"Does the eSIM keep working while I drive between cities?","a":"Yes, it stays connected along the main N-routes, with occasional gaps in remote areas."},{"q":"Can I use it in Lesotho or Eswatini?","a":"No. Each Weettah plan covers the country you bought it for; buy a separate plan for other destinations."}]'),
('united-arab-emirates','United Arab Emirates','Dubai and Abu Dhabi expect you to be online — check-ins, metro cards, desert tour pickups, and mall navigation all live on your phone. A Weettah eSIM has you connected the moment you step off at DXB or AUH.','Your eSIM connects to leading UAE networks including e& (Etisalat) and du, with excellent 4G and 5G across Dubai, Abu Dhabi and Sharjah, and coverage along the main desert highways.','Abu Dhabi','UAE dirham (AED)','Arabic (official), English widely spoken','Type G, 230V','999 (police), 998 (ambulance)','November to March, when temperatures are mild',
'["Some voice and video calling apps are restricted on UAE networks; plan to use regular calls or approved apps.","Summer heat is extreme from June to September — indoor plans are wise.","Dress modestly at mosques and in traditional districts."]',
'[{"q":"Can I make WhatsApp calls in the UAE?","a":"Voice and video calling over some apps is restricted on UAE networks regardless of which eSIM or SIM you use. Messaging generally works."},{"q":"Does the eSIM cover both Dubai and Abu Dhabi?","a":"Yes, one plan covers the whole country."},{"q":"Will it work on a desert safari?","a":"Along the main routes and at most camps, yes. Deep dune areas can lose signal."}]'),
('united-kingdom','United Kingdom','Rail apps, contactless travel, and last-minute directions in the rain — a UK trip runs on data. A Weettah eSIM connects on arrival at Heathrow, Gatwick, Manchester or Edinburgh so you can tap into transport apps straight away.','Your eSIM connects to leading UK networks including EE, Vodafone, O2 and Three, with strong 4G and 5G in cities and along rail corridors. Some Scottish Highlands and rural Welsh routes have patchy service.','London','Pound sterling (GBP)','English (Welsh and Gaelic also official in parts)','Type G, 230V','999 or 112','May to September for the longest, driest days',
'["Contactless pay-as-you-go works on London transport — no need for a paper ticket.","Book intercity trains early; walk-up fares are much higher.","Signal drops in long rail tunnels and on parts of the Underground."]',
'[{"q":"Does the eSIM cover Scotland, Wales and Northern Ireland?","a":"Yes, the plan covers the whole United Kingdom."},{"q":"Does it work on the London Underground?","a":"Many stations and tunnels now have coverage, but not all — expect gaps between stops."},{"q":"Can I use it in Ireland?","a":"No, the Republic of Ireland is a separate country and needs its own plan."}]'),
('united-states','United States','Distances are long and plans change fast in the US: rental car navigation, airport gate changes, and hotel check-ins all want data. A Weettah eSIM is connected before you leave the terminal.','Your eSIM connects to leading US networks including AT&T, T-Mobile and Verizon, with broad 4G LTE and 5G coverage in cities and along interstates. National parks and remote desert or mountain roads can have no signal at all.','Washington, D.C.','US dollar (USD)','English (Spanish widely spoken)','Types A and B, 120V','911','Varies by region; spring and autumn suit most road trips',
'["Download offline maps before national parks — coverage inside them is unreliable.","Tipping is expected in restaurants, usually 15 to 20 percent.","Domestic flights need extra time for security at large hubs."]',
'[{"q":"Does the plan cover all 50 states?","a":"It covers the mainland United States broadly. Alaska and Hawaii coverage can be more limited."},{"q":"Can I tether to a laptop?","a":"Yes, hotspot use is included in your data allowance."},{"q":"Will I have signal in national parks?","a":"Often not. Download maps and reservations before you go in."}]'),
('japan','Japan','Japan is easy to travel and easier still with data: train times change platform by platform, restaurants take app bookings, and translation tools earn their keep. A Weettah eSIM connects the moment you land at Haneda, Narita or Kansai.','Your eSIM connects to leading Japanese networks including NTT Docomo, au (KDDI) and SoftBank. Coverage is excellent nationwide, including on the shinkansen, in subways and across most rural prefectures.','Tokyo','Japanese yen (JPY)','Japanese','Types A and B, 100V','110 (police), 119 (fire and ambulance)','March to May for cherry blossom, October to November for autumn colour',
'["Get an IC transit card on your phone where supported — it works on most trains and convenience stores.","Cash is still useful at small restaurants and shrines.","Rubbish bins are rare in public; carry your litter until you find one."]',
'[{"q":"Does the eSIM work on the shinkansen?","a":"Yes, coverage along the main bullet train lines is strong, with brief drops in tunnels."},{"q":"Can I use translation apps offline?","a":"You can, but with a Weettah plan you will have live data almost everywhere, which works better."},{"q":"Do I need to register the eSIM with an address in Japan?","a":"No. Travel eSIMs need no local registration or paperwork."}]');

import zipfile
import html
import os

def esc(text):
    return html.escape(str(text))

def make_shape(sp_id, name, x, y, cx, cy, fill_hex=None, border_hex=None, text_paragraphs=None, radius=False):
    fill_xml = f'<a:solidFill><a:srgbClr val="{fill_hex}"/></a:solidFill>' if fill_hex else '<a:noFill/>'
    border_xml = f'<a:ln w="15000"><a:solidFill><a:srgbClr val="{border_hex}"/></a:solidFill></a:ln>' if border_hex else '<a:ln><a:noFill/></a:ln>'
    
    geom = "roundRect" if radius else "rect"
    
    p_xml = ""
    if text_paragraphs:
        for p in text_paragraphs:
            align = p.get('align', 'l') # l, ctr, r
            algn_attr = f' algn="{align}"' if align else ''
            runs_xml = ""
            for r in p.get('runs', []):
                bold = ' b="1"' if r.get('bold') else ''
                sz = f' sz="{r.get("sz", 1400)}"'
                color = r.get('color', 'F8FAFC')
                typeface = r.get('typeface', 'Helvetica Neue')
                runs_xml += f"""<a:r>
                  <a:rPr lang="en-US"{sz}{bold}>
                    <a:solidFill><a:srgbClr val="{color}"/></a:solidFill>
                    <a:latin typeface="{typeface}"/>
                  </a:rPr>
                  <a:t>{esc(r.get('text', ''))}</a:t>
                </a:r>"""
            
            bu = ""
            if p.get('bullet'):
                bu = '<a:buChar char="•"/><a:buSzPts val="1200"/>'
            else:
                bu = '<a:buNone/>'
                
            marL = ' marL="288000" indent="-288000"' if p.get('bullet') else ''
            
            p_xml += f"""<a:p>
              <a:pPr{algn_attr}{marL}>{bu}</a:pPr>
              {runs_xml}
            </a:p>"""
    else:
        p_xml = "<a:p><a:endParaRPr lang='en-US'/></a:p>"
        
    anchor = 't'
    if text_paragraphs and len(text_paragraphs) > 0 and 'anchor' in text_paragraphs[0]:
        anchor = text_paragraphs[0]['anchor']

    return f"""<p:sp>
      <p:nvSpPr>
        <p:cNvPr id="{sp_id}" name="{esc(name)}"/>
        <p:cNvSpPr/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
        <a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom>
        {fill_xml}
        {border_xml}
      </p:spPr>
      <p:txBody>
        <a:bodyPr vert="horz" lIns="144000" tIns="108000" rIns="144000" bIns="108000" rtlCol="0" anchor="{anchor}"/>
        <a:lstStyle/>
        {p_xml}
      </p:txBody>
    </p:sp>"""

def build_presentation(output_pptx):
    # 16:9 dimensions: cx = 12192000, cy = 6858000
    slides_data = []

    # =========================================================================
    # SLIDE 1: TITLE SLIDE - COMPLETE PRODUCT & ARCHITECTURE GUIDE
    # =========================================================================
    s1 = []
    s1.append(make_shape(10, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s1.append(make_shape(11, "CardBorder", 914400, 700000, 10363200, 5458000, fill_hex="111827", border_hex="38BDF8", radius=True))
    s1.append(make_shape(12, "Badge", 1371600, 1100000, 4200000, 420000, fill_hex="1E293B", border_hex="6366F1", text_paragraphs=[
        {'align': 'ctr', 'runs': [{'text': '⚡ DECENTRALIZED WEB3 FINANCIAL dAPP', 'sz': 1100, 'bold': True, 'color': '38BDF8'}]}
    ], radius=True))
    s1.append(make_shape(13, "Title", 1371600, 1750000, 9400000, 1500000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'FairShare — Product Walkthrough', 'sz': 4000, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Frontend UI Guide, Feature Mechanics & Real-World Use Cases', 'sz': 2100, 'bold': False, 'color': '94A3B8'}]}
    ]))
    s1.append(make_shape(14, "Description", 1371600, 3450000, 9400000, 1100000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'A complete visual and architectural tour: from interactive UI screens and consensus voting to client-side SHA-256 invoice hashing, Min-Cash-Flow graph debt resolution, and zero-trust audit trails.', 'sz': 1400, 'color': 'CBD5E1'}]}
    ]))
    pills = "7 Integrated Tabs  •  25 UI Components  •  Solidity 0.8.20  •  React 19  •  Ethers.js v6  •  Min-Cash-Flow  •  WebSocket Sync"
    s1.append(make_shape(15, "Pills", 1371600, 4800000, 9400000, 500000, fill_hex="1E293B", text_paragraphs=[
        {'align': 'ctr', 'runs': [{'text': pills, 'sz': 1200, 'bold': True, 'color': '34D399'}]}
    ], radius=True))
    slides_data.append(s1)

    # =========================================================================
    # SLIDE 2: REAL-WORLD PROBLEM & PRACTICAL USE CASES
    # =========================================================================
    s2 = []
    s2.append(make_shape(20, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s2.append(make_shape(21, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Real-World Problem & Practical Use Cases', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Why decentralized expense tracking solves real-world human trust dilemmas', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left: The Flaws of Existing Tools
    s2.append(make_shape(22, "LeftCard", 731520, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="EF4444", radius=True))
    s2.append(make_shape(23, "LeftText", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Why Traditional Split Apps Fail in Reality', 'sz': 1700, 'bold': True, 'color': 'F87171'}]},
        {'runs': [{'text': '', 'sz': 400}]},
        {'bullet': True, 'runs': [{'text': 'Unilateral Entry: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'A roommate logs a ₹4,000 grocery bill; everyone is charged before anyone inspects the bill.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Silent History Overwriting: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'In Excel/Splitwise, records can be edited or deleted months later without audit proof.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Doctored Receipts: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Images can be photoshopped or swapped after submission.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Circular Debt Inefficiency: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'A pays B, B pays C, C pays A. Groups waste fees and time with multi-hop payments.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Device Impersonation: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'On a shared living room laptop, anyone can tap "Approve" pretending to be someone else.', 'color': 'CBD5E1'}]}
    ]))
    # Right: The 5 Big Real-World Use Cases
    s2.append(make_shape(24, "RightCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="10B981", radius=True))
    s2.append(make_shape(25, "RightText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '5 High-Impact Real-World Scenarios', 'sz': 1700, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 400}]},
        {'bullet': True, 'runs': [{'text': '1. Apartment Flatmates: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Rent, Wi-Fi, cleaning supplies. No balance updates until quorum verifies the receipt.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': '2. Group Travel & Trips: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Flights, villas, car rentals. Min-Cash-Flow resolves 20 complex IOUs into 2 final payments.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': '3. Hackathon & College Teams: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Splitting cloud hosting (AWS/OpenAI APIs) & hardware with transparent admin policies.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': '4. Freelancer Collectives / DAOs: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Direct atomic mock stablecoin (FSUSD) payouts on Base Sepolia blockchain.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': '5. Corporate Petty Cash & Clubs: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Non-deletion audit trail prevents embezzlement and satisfies external auditors.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s2)

    # =========================================================================
    # SLIDE 3: FRONTEND UI - NAVBAR & PERSONA SWITCHING
    # =========================================================================
    s3 = []
    s3.append(make_shape(30, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s3.append(make_shape(31, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 1: Multi-Persona Switching & Wallet Bar', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Instant persona toggling for local testing + full Web3 MetaMask connectivity', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left: UI Visual Representation
    s3.append(make_shape(32, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="38BDF8", radius=True))
    s3.append(make_shape(33, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (Navbar.jsx)', 'sz': 1500, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': '[ BRAND ]  FairShare  |  Apartment 402  ▼', 'sz': 1300, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Active Persona Selector Buttons:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [ Alice (Admin) ★ ]  [ Bob ]  [ Charlie ]  [ Dana ]', 'sz': 1250, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Status Badges & Controls in Header:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' • Network:  [ Base Sepolia (84532) 🟢 ]', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • Wallet:   [ 0x7099...79C8 🦊 ]', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • Stealth:  [ 👁️ Privacy Mask: OFF ]', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • Sync:     [ 📶 Live LAN WebSocket Connected ]', 'sz': 1200, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Device Banner (Sub-header):', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' "Logged in as Alice (Admin). You have 2 Consensus Blocks requiring your signature."', 'sz': 1150, 'bold': True, 'color': 'FDE047'}]}
    ]))
    # Right: How it works & Real World
    s3.append(make_shape(34, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="6366F1", radius=True))
    s3.append(make_shape(35, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'How It Works & Technical Flow', 'sz': 1700, 'bold': True, 'color': 'A5B4FC'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Dual Mode Authentication: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Allows switching personas (Alice, Bob, Charlie, Dana) instantly without signing out, OR connecting real MetaMask accounts.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Reactive State Store: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'When persona switches, blockchainState.js recalculates that user\'s personal net balance, pending votes, and permissions immediately.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Network Modal: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Prompts MetaMask to switch chainId to Base Sepolia or Polygon Amoy with fallback RPCs.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Testing & Demos: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Allows a single project presenter or evaluator to demonstrate an entire 4-way multi-signature consensus workflow from one browser without needing 4 separate laptops.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s3)

    # =========================================================================
    # SLIDE 4: FRONTEND UI - DASHBOARD OVERVIEW & FINANCIAL INTEGRITY
    # =========================================================================
    s4 = []
    s4.append(make_shape(40, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s4.append(make_shape(41, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 2: Dashboard Overview & Integrity Gauge', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Real-time financial status, zero-sum solvency check, and expense analytics', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s4.append(make_shape(42, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="34D399", radius=True))
    s4.append(make_shape(43, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (DashboardOverview.jsx)', 'sz': 1500, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Top Metric Cards Grid:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [ Total Volume: ₹14,250 ]   [ My Net: +₹1,250.00 🟢 ]', 'sz': 1250, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' [ Pending Quorum: 2 ]       [ Active Disputes: 0 🛡️ ]', 'sz': 1250, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Mathematical Integrity Badge:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [ ✔ LEDGER INTEGRITY SOUND: Net Zero-Sum (∑ = ₹0.00) ]', 'sz': 1200, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Category Breakdown Visual Progress:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' • Groceries:  ₹6,500 (46%) [████████░░░░]', 'sz': 1150, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • Rent/Bills: ₹5,000 (35%) [██████░░░░░░]', 'sz': 1150, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • Dining Out: ₹2,750 (19%) [███░░░░░░░░░]', 'sz': 1150, 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Quick Action Row:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [+ Add Expense]  [🔗 Copy Auditor Link]  [👁️ Stealth Mask]', 'sz': 1200, 'bold': True, 'color': '818CF8'}]}
    ]))
    # Right Explanation
    s4.append(make_shape(44, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="38BDF8", radius=True))
    s4.append(make_shape(45, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Mathematical Solvency & Verification', 'sz': 1700, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Zero-Sum Check: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Calculates the sum of all members\' net balances. In any closed economic system, total credits must equal total debits (∑ balances = 0). If |sum| > 1 cent, the UI flashes an alert.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Stealth Privacy Mask: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Replaces all monetary figures with ₹•••••• at the click of a button, letting users share their screen or work in public cafes safely.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Auditor Read-Only Link: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Generates a scoped URL allowing landlords or accountants to view verified invoices without voting privileges.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Guaranteed Solvency: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Ensures no phantom money or rounding bugs creep into roommates\' rent and utility tallies over months of group living.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s4)

    # =========================================================================
    # SLIDE 5: FRONTEND UI - CONSENSUS HUB & VERIFICATION BLOCKS
    # =========================================================================
    s5 = []
    s5.append(make_shape(50, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s5.append(make_shape(51, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 3: Consensus Hub & Verification Blocks', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Multi-party verification blocks where participants explicitly cast Agree or Reject votes', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s5.append(make_shape(52, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="F59E0B", radius=True))
    s5.append(make_shape(53, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (ConsensusBlock.jsx)', 'sz': 1500, 'bold': True, 'color': 'F59E0B'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'CONSENSUS BLOCK #104  [ Status: PENDING QUORUM ⏳ ]', 'sz': 1300, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Title: "March Wi-Fi & Electric Bill"  •  Total: ₹3,200', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Payer: Alice  •  Policy: MAJORITY_VOTE (>50%)', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Participant Quorum Status:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' • Alice (Payer):   Owes ₹800  [ Auto-Signed ✔ ]', 'sz': 1150, 'color': '34D399'}]},
        {'runs': [{'text': ' • Bob:             Owes ₹800  [ AGREED ✔ (PIN 2222) ]', 'sz': 1150, 'color': '34D399'}]},
        {'runs': [{'text': ' • Charlie:         Owes ₹800  [ ⏳ Awaiting Vote ]', 'sz': 1150, 'color': 'FDE047'}]},
        {'runs': [{'text': ' • Dana:            Owes ₹800  [ ⏳ Awaiting Vote ]', 'sz': 1150, 'color': 'FDE047'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Quorum Progress: 50% reached (2 of 4)', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [████████████░░░░░░░░░░░░] Needs 1 more vote', 'sz': 1200, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Action Buttons for Active User:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [ ✔ AGREE & SIGN (PIN) ]     [ ❌ REJECT & OBJECT ]', 'sz': 1250, 'bold': True, 'color': 'F87171'}]}
    ]))
    # Right Explanation
    s5.append(make_shape(54, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="F59E0B", radius=True))
    s5.append(make_shape(55, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Consensus Mechanics & Execution', 'sz': 1700, 'bold': True, 'color': 'F59E0B'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Balances Remain Frozen: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Unlike ordinary apps that immediately add debt to everyone\'s account, FairShare holds the transaction in an escrowed block state.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Threshold Condition: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Under Majority Vote, once Charlie votes "Agree", the contract executes approveExpense(), instantly adjusting everyone\'s balances simultaneously.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Objection Halt: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'If Dana clicks "Reject & Object", she enters a formal reason ("I was out of town all March"). The block enters DISPUTED status, preventing balance changes.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Protection Against Rogue Logging: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Prevents one roommate from logging an exorbitant dinner or personal purchase without all parties consciously vetting and approving their share.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s5)

    # =========================================================================
    # SLIDE 6: FRONTEND UI - ANTI-CHEAT CRYPTOGRAPHIC PIN SIGNATURE
    # =========================================================================
    s6 = []
    s6.append(make_shape(60, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s6.append(make_shape(61, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 4: Anti-Cheat Cryptographic PIN Signature', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Simulated ECDSA private key signature preventing impersonation on shared devices', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s6.append(make_shape(62, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="818CF8", radius=True))
    s6.append(make_shape(63, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (SignVoteModal.jsx)', 'sz': 1500, 'bold': True, 'color': '818CF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'MODAL: "CRYPTOGRAPHIC PIN VERIFICATION REQUIRED"', 'sz': 1250, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Signing as: Charlie  (Wallet: 0x90F7...4bE1)', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Action: Confirm Approval of ₹800 Share in Block #104', 'sz': 1200, 'color': '34D399'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Enter Your 4-Digit Security PIN:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': '    [ ● ]   [ ● ]   [ ● ]   [ ● ]', 'sz': 2200, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '  (Keypad: 1 2 3 / 4 5 6 / 7 8 9 / Clear 0 Enter)', 'sz': 1100, 'color': '64748B'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Anti-Cheat Defense Notice:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' "This PIN simulates your ECDSA private key signature. Even if another user selects your persona on this device, they cannot cast a vote without your secret PIN."', 'sz': 1100, 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': ' [ ✍️ SIGN & CAST VOTE ]       [ CANCEL ]', 'sz': 1250, 'bold': True, 'color': '34D399'}]}
    ]))
    # Right Explanation
    s6.append(make_shape(64, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="818CF8", radius=True))
    s6.append(make_shape(65, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'The Shared Device Problem & Solution', 'sz': 1700, 'bold': True, 'color': 'A5B4FC'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'The Real Dilemma: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'In college apartments or hostel rooms, friends often share a laptop or leave a tablet on the table. Without security, someone could simply switch to your name and approve their own expense.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'ECDSA Private Key Simulation: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Every persona has a secret PIN (Alice: 1111, Bob: 2222, Charlie: 3333, Dana: 4444). authService.js hashes the PIN against stored credentials.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Cryptographic Audit Seal: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Once verified, the vote is logged with voter address, timestamp, and signature state in the immutable audit log.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Zero-Trust Living: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'No member can be fraudulently billed or impersonated, guaranteeing that every vote reflects genuine consent.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s6)

    # =========================================================================
    # SLIDE 7: FRONTEND UI - ADD EXPENSE & SHA-256 RECEIPT HASHING
    # =========================================================================
    s7 = []
    s7.append(make_shape(70, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s7.append(make_shape(71, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 5: Expense Submission & SHA-256 Invoices', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Flexible split models (Equal, Exact, %) + client-side document fingerprinting', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s7.append(make_shape(72, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="38BDF8", radius=True))
    s7.append(make_shape(73, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (AddExpenseModal.jsx)', 'sz': 1500, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'MODAL: "LOG NEW EXPENSE FOR CONSENSUS"', 'sz': 1250, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Expense Title:   [ Team Dinner at Bistro     ]', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Total Amount:    [ ₹4,800.00                 ]', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Category:        [ 🍔 Food & Dining          ]', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Split Type Tabs: [ EQUAL ]  [ EXACT ]  [ PERCENT ]', 'sz': 1200, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '  -> 4 Members Selected = ₹1,200.00 each', 'sz': 1150, 'color': '34D399'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Receipt Dropzone Area:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [ 📁 Drag & Drop Receipt PDF or Image here ]', 'sz': 1200, 'bold': True, 'color': '818CF8'}]},
        {'runs': [{'text': ' File: "restaurant_invoice.pdf" (1.2 MB)', 'sz': 1150, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' SHA-256: 0xa48e2f...7c19  [ COMPUTED IN BROWSER ✔ ]', 'sz': 1100, 'color': '34D399'}]},
        {'runs': [{'text': ' IPFS CID: QmZtmD2q...X9w2 [ ANCHORED TO CHAIN ]', 'sz': 1100, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': ' [ 🚀 SUBMIT TO CONSENSUS BLOCK ]', 'sz': 1300, 'bold': True, 'color': '34D399'}]}
    ]))
    # Right Explanation
    s7.append(make_shape(74, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="38BDF8", radius=True))
    s7.append(make_shape(75, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Client-Side Hashing & Storage Architecture', 'sz': 1700, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Web Crypto SHA-256: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'The file binary is read as an ArrayBuffer inside the browser. crypto.subtle.digest produces a cryptographic 256-bit hash before any network transmission.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'On-Chain Fingerprint: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Only the 32-byte hash and IPFS CID are committed to the blockchain, saving massive gas fees while achieving 100% tamper-evidence.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Flexible Split Models: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Supports Equal splits, Exact rupee amounts per person, or Percentage-based distributions, with automated sum validation.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Falsified Invoices Impossible: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'If a user edits even one digit on the PDF receipt later, the SHA-256 hash completely changes, catching doctored bills instantly.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s7)

    # =========================================================================
    # SLIDE 8: FRONTEND UI - RECEIPT VERIFIER WORKBENCH
    # =========================================================================
    s8 = []
    s8.append(make_shape(80, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s8.append(make_shape(81, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 6: Receipt Verifier & Integrity Workbench', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Zero-trust file drop verifier proving invoice authenticity against on-chain block hash', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s8.append(make_shape(82, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="10B981", radius=True))
    s8.append(make_shape(83, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (ReceiptVerifier.jsx)', 'sz': 1500, 'bold': True, 'color': '10B981'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'INVOICE INTEGRITY VERIFIER TAB', 'sz': 1300, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Select Expense to Audit: [ #104: Wi-Fi & Electric Bill ▼ ]', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Expected On-Chain Hash: 0xa48e2f...7c19', 'sz': 1150, 'color': '94A3B8'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Drag & Drop Auditor Box:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [ 🔍 DROP INVOICE TO PROVE NO TAMPERING ]', 'sz': 1300, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': ' File Loaded: "electric_march_final.pdf"', 'sz': 1150, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Calculated Local Digest: 0xa48e2f...7c19', 'sz': 1150, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Verification Banner (Live Status):', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' [ ✅ 100% CRYPTOGRAPHIC MATCH CONFIRMED ]', 'sz': 1300, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': ' "This document matches the exact bytes signed by Alice and approved by the group on chain at Block #104."', 'sz': 1100, 'color': 'CBD5E1'}]}
    ]))
    # Right Explanation
    s8.append(make_shape(84, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="10B981", radius=True))
    s8.append(make_shape(85, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Zero-Trust Auditability', 'sz': 1700, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Independent Proof: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Any participant or auditor can verify a receipt without contacting the original uploader or relying on a centralized server.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Bitwise Precision: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'If an invoice has its total edited from ₹2,000 to ₹3,000 in Photoshop, the local SHA-256 hash immediately differs. The UI turns bright red: [ ❌ HASH MISMATCH: TAMPER DETECTED ].', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Audit Export: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Produces a verifiable audit certificate that can be shared with landlords, treasurers, or club advisers.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Club & Event Treasuries: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'College cultural clubs and student bodies can prove to university auditors that every sponsor reimbursement exactly matches approved invoices.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s8)

    # =========================================================================
    # SLIDE 9: FRONTEND UI - MIN-CASH-FLOW SETTLEMENT HUB
    # =========================================================================
    s9 = []
    s9.append(make_shape(90, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s9.append(make_shape(91, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 7: Min-Cash-Flow Settlement Hub', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Graph-theoretic debt simplification algorithm + atomic crypto & off-chain UPI settlements', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s9.append(make_shape(92, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="38BDF8", radius=True))
    s9.append(make_shape(93, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (SettlementHub.jsx)', 'sz': 1500, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'MIN-CASH-FLOW OPTIMIZED DIRECT SETTLEMENT PLAN', 'sz': 1250, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Condensed 8 circular group debts into 2 direct payments:', 'sz': 1200, 'color': '34D399'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Card 1: Bob -> Alice', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' Bob owes Alice  ₹1,200.00', 'sz': 1300, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' [ ⚡ Pay with FSUSD (Crypto) ]  [ 📱 Pay UPI / Cash ]', 'sz': 1150, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Card 2: Charlie -> Dana', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' Charlie owes Dana  ₹650.00', 'sz': 1300, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' [ ⚡ Pay with FSUSD (Crypto) ]  [ 📱 Pay UPI / Cash ]', 'sz': 1150, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Settlement History Table:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' • 10/17: Bob paid Alice ₹1,200 (Tx: 0x3d9...71b) [CONFIRMED ✔]', 'sz': 1100, 'color': 'CBD5E1'}]},
        {'runs': [{'text': '   (Canvas Confetti Celebration triggers on settlement!)', 'sz': 1050, 'color': 'FDE047'}]}
    ]))
    # Right Explanation
    s9.append(make_shape(94, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="38BDF8", radius=True))
    s9.append(make_shape(95, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Graph Theory & Multi-Mode Settlement', 'sz': 1700, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Min-Cash-Flow Algorithm: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Solves the classic N-party debt graph. Computes net balances for each person, then greedily pairs the max debtor with the max creditor until all debts reach zero.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Dual Settlement Modes: ', 'bold': True, 'color': 'FFFFFF'}, {'text': '', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': '  1. Atomic On-Chain Crypto: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Transfers mock stablecoin (FSUSD) directly on Base Sepolia. Balances auto-settle upon transaction receipt.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': '  2. Off-Chain UPI / Cash: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Payer enters UPI Tx ID; payee clicks "Confirm Received" to balance ledger.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Group Vacation Settlements: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'After a 7-day trip where 5 friends made 30 separate purchases, members settle the whole trip in just 2 or 3 direct payments.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s9)

    # =========================================================================
    # SLIDE 10: FRONTEND UI - IMMUTABLE AUDIT TRAIL & CORRECTIONS
    # =========================================================================
    s10 = []
    s10.append(make_shape(100, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s10.append(make_shape(101, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 8: Immutable Audit Trail & Non-Deletion Diffs', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Permanent ledger lineage preserving original entries while anchoring versioned revisions', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s10.append(make_shape(102, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="C084FC", radius=True))
    s10.append(make_shape(103, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (AuditTrail.jsx)', 'sz': 1500, 'bold': True, 'color': 'C084FC'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'IMMUTABLE AUDIT TIMELINE FEED', 'sz': 1300, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Filter: [ ALL EVENTS ]  [ EXPENSES ]  [ VOTES ]  [ REVISIONS ]', 'sz': 1150, 'color': '94A3B8'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Timeline Item #1: EXPENSE CORRECTION ANCHOR', 'sz': 1200, 'bold': True, 'color': 'F59E0B'}]},
        {'runs': [{'text': ' Block #102 revised to Block #105 by Alice (Admin)', 'sz': 1150, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Revision Diff Viewer:', 'sz': 1150, 'color': '94A3B8'}]},
        {'runs': [{'text': '  - Old Total: ₹3,000.00 (Split: Alice, Bob, Charlie)', 'sz': 1100, 'color': 'F87171'}]},
        {'runs': [{'text': '  + New Total: ₹3,500.00 (Split: Alice, Bob, Charlie, Dana)', 'sz': 1100, 'color': '34D399'}]},
        {'runs': [{'text': '  Reason: "Dana joined late; included in electricity share."', 'sz': 1100, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' Ancestor Link: Links immutably to Block #102 (Never Deleted)', 'sz': 1100, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Timeline Item #2: SETTLEMENT ACKNOWLEDGMENT', 'sz': 1200, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': ' Bob -> Alice: ₹1,200 FSUSD Transferred. Tx: 0x9f...4a', 'sz': 1100, 'color': 'CBD5E1'}]}
    ]))
    # Right Explanation
    s10.append(make_shape(104, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="C084FC", radius=True))
    s10.append(make_shape(105, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'The Non-Deletion Accounting Principle', 'sz': 1700, 'bold': True, 'color': 'C084FC'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Why No Delete Button? ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'In traditional apps, deleting an expense erases history and makes financial auditing impossible. In FairShare, records can only be corrected, never deleted.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Parent-Child Delta Chains: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'When an expense is revised, correctExpense() flags the original record as CORRECTED and links it to the newly minted block containing the updated shares.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Mandatory Quorum on Revisions: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'The corrected block must be re-voted on by group members before balances re-adjust, preventing unilateral edits.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Dispute Proof: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'When lease terms end, roommates have an indisputable, tamper-proof audit trail of every rent, maintenance, and utility change over the whole year.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s10)

    # =========================================================================
    # SLIDE 11: FRONTEND UI - MULTI-DEVICE LAN SYNC & WEBSOCKETS
    # =========================================================================
    s11 = []
    s11.append(make_shape(110, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s11.append(make_shape(111, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 9: Multi-Device LAN Real-Time Sync', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Instant state replication across phones & laptops over local Wi-Fi with QR code scanning', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s11.append(make_shape(112, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="34D399", radius=True))
    s11.append(make_shape(113, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (ConnectDevicesModal.jsx)', 'sz': 1500, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'CONNECT OTHER PHONES / LAPTOPS ON YOUR WI-FI', 'sz': 1250, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Auto-Detected LAN IP: http://192.168.1.42:5173', 'sz': 1200, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'QR Code Display Box:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': '  [ ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ]', 'sz': 1000, 'color': 'FFFFFF'}]},
        {'runs': [{'text': '  [ ■  SCAN WITH YOUR PHONE CAMERA TO SYNC  ■ ]', 'sz': 1100, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '  [ ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ]', 'sz': 1000, 'color': 'FFFFFF'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Live Sync Status Indicators:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' • Active Connected Clients: 3 (Laptop, iPhone, Android)', 'sz': 1150, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • WebSocket Latency: 4ms [ 🟢 ULTRA-FAST LAN ]', 'sz': 1150, 'color': '34D399'}]},
        {'runs': [{'text': ' • Disk Persistence: fairshare_ledger_db.json [ CACHED ✔ ]', 'sz': 1150, 'color': '38BDF8'}]}
    ]))
    # Right Explanation
    s11.append(make_shape(114, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="34D399", radius=True))
    s11.append(make_shape(115, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Zero-Setup Local Network Relay', 'sz': 1700, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Auto LAN IP Detection: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'server.js queries network interfaces to find the machine\'s Wi-Fi IPv4 address (e.g. 192.168.x.x) and renders a dynamic QR code.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Live WebSocket Mesh: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'When Alice logs an expense on her laptop, the WebSocket broadcast (/fairshare-sync) updates Bob\'s phone screen in less than 10 milliseconds.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Resilient State Replay: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'If a phone loses Wi-Fi connection and reconnects, server.js immediately replays the latest ledger state from disk.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'align': 'l', 'runs': [{'text': '🌍 Real-World Use Case', 'sz': 1600, 'bold': True, 'color': '34D399'}]},
        {'bullet': True, 'runs': [{'text': 'Living Room Collaboration: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Roommates sitting on the couch can simultaneously vote, inspect invoices, and trigger settlements on their own personal phones in real time.', 'color': 'CBD5E1'}]}
    ]))
    slides_data.append(s11)

    # =========================================================================
    # SLIDE 12: FRONTEND UI - GOVERNANCE, POLICIES & EXECUTIVE SUMMARY
    # =========================================================================
    s12 = []
    s12.append(make_shape(120, "Bg", 0, 0, 12192000, 6858000, fill_hex="0B0F19"))
    s12.append(make_shape(121, "Header", 731520, 500000, 10728960, 800000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'Feature 10: Group Governance & Executive Summary', 'sz': 2800, 'bold': True, 'color': 'FFFFFF'}]},
        {'align': 'l', 'runs': [{'text': 'Configurable smart contract consensus policies and overall project recap', 'sz': 1400, 'color': '94A3B8'}]}
    ]))
    # Left UI Mock
    s12.append(make_shape(122, "UIMock", 731520, 1450000, 5100000, 4900000, fill_hex="0F172A", border_hex="38BDF8", radius=True))
    s12.append(make_shape(123, "UIMockContent", 931520, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': '🖥️ FRONTEND APPEARANCE (GroupManagement.jsx)', 'sz': 1500, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'GROUP GOVERNANCE & CONSENSUS SETTINGS', 'sz': 1300, 'bold': True, 'color': 'FFFFFF'}]},
        {'runs': [{'text': ' Active Group: "Apartment 402"  (Members: 4)', 'sz': 1200, 'color': 'CBD5E1'}]},
        {'runs': [{'text': '---------------------------------------------------------', 'color': '475569', 'sz': 1000}]},
        {'runs': [{'text': 'Consensus Approval Policy Selector:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' ( ) AUTO_APPROVE    (Optimistic with dispute window)', 'sz': 1100, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' (●) MAJORITY_VOTE   (>50% agreement required) [ACTIVE]', 'sz': 1150, 'bold': True, 'color': '34D399'}]},
        {'runs': [{'text': ' ( ) UNANIMOUS_VOTE  (100% agreement required)', 'sz': 1100, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' ( ) ADMIN_ONLY      (Only Alice can approve)', 'sz': 1100, 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'runs': [{'text': 'Member Roster & Roles Table:', 'sz': 1200, 'color': '94A3B8'}]},
        {'runs': [{'text': ' • Alice:   0x7099...79C8  [ ROLE: ADMIN 👑 ]', 'sz': 1150, 'color': 'F59E0B'}]},
        {'runs': [{'text': ' • Bob:     0x3C44...9bC3  [ ROLE: MEMBER 👤 ]', 'sz': 1150, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • Charlie: 0x90F7...4bE1  [ ROLE: MEMBER 👤 ]', 'sz': 1150, 'color': 'CBD5E1'}]},
        {'runs': [{'text': ' • Dana:    0x15d3...F5bC  [ ROLE: MEMBER 👤 ]', 'sz': 1150, 'color': 'CBD5E1'}]}
    ]))
    # Right Explanation
    s12.append(make_shape(124, "ExplCard", 6360000, 1450000, 5100000, 4900000, fill_hex="111827", border_hex="38BDF8", radius=True))
    s12.append(make_shape(125, "ExplText", 6560000, 1600000, 4700000, 4600000, text_paragraphs=[
        {'align': 'l', 'runs': [{'text': 'FairShare: Complete Value Summary', 'sz': 1700, 'bold': True, 'color': '38BDF8'}]},
        {'runs': [{'text': '', 'sz': 300}]},
        {'bullet': True, 'runs': [{'text': 'Zero Discrepancies: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Every calculation is verified on-chain; math errors and subjective spreadsheet disagreements are permanently eradicated.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Cryptographic Integrity: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'SHA-256 invoices and PIN signatures simulate real-world cryptographic defense against fraud and doctored receipts.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Algorithmic Optimization: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Min-Cash-Flow condenses circular group debts into minimal direct settlements.', 'color': 'CBD5E1'}]},
        {'bullet': True, 'runs': [{'text': 'Production-Ready Architecture: ', 'bold': True, 'color': 'FFFFFF'}, {'text': 'Solidity ^0.8.20 + React 19 + Vite 8 + WebSocket mesh + Base Sepolia deployment.', 'color': 'CBD5E1'}]},
        {'runs': [{'text': '', 'sz': 400}]},
        {'align': 'ctr', 'runs': [{'text': '🎉 FairShare: True Transparency for Shared Living & Team Expenses', 'sz': 1250, 'bold': True, 'color': '34D399'}]}
    ]))
    slides_data.append(s12)

    # --- ASSEMBLE OPENXML PACKAGE ---
    content_types_entries = [
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
    ]
    for i in range(1, len(slides_data) + 1):
        content_types_entries.append(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')

    content_types = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  {chr(10).join(content_types_entries)}
</Types>"""

    root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>"""

    sld_id_lst = []
    pres_rels_list = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    ]
    for i in range(1, len(slides_data) + 1):
        rel_id = f"rId{i + 1}"
        sld_id = 255 + i
        sld_id_lst.append(f'<p:sldId id="{sld_id}" r:id="{rel_id}"/>')
        pres_rels_list.append(f'<Relationship Id="{rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>')

    pres_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    {chr(10).join(sld_id_lst)}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="12192000"/>
</p:presentation>"""

    pres_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {chr(10).join(pres_rels_list)}
</Relationships>"""

    theme_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Dark Slate Theme">
  <a:themeElements>
    <a:clrScheme name="DarkSlate">
      <a:dk1><a:srgbClr val="0B0F19"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
      <a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>
      <a:accent1><a:srgbClr val="38BDF8"/></a:accent1>
      <a:accent2><a:srgbClr val="818CF8"/></a:accent2>
      <a:accent3><a:srgbClr val="34D399"/></a:accent3>
      <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
      <a:accent5><a:srgbClr val="EC4899"/></a:accent5>
      <a:accent6><a:srgbClr val="64748B"/></a:accent6>
      <a:hlink><a:srgbClr val="38BDF8"/></a:hlink>
      <a:folHlink><a:srgbClr val="818CF8"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="ModernFont">
      <a:majorFont><a:latin typeface="Helvetica Neue"/></a:majorFont>
      <a:minorFont><a:latin typeface="Helvetica"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectLst/></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>"""

    master_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>"""

    master_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>"""

    layout_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             type="blank" preserve="1">
  <p:cSld name="Blank Layout">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
</p:sldLayout>"""

    layout_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>"""

    slide_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>"""

    with zipfile.ZipFile(output_pptx, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', root_rels)
        z.writestr('ppt/presentation.xml', pres_xml)
        z.writestr('ppt/_rels/presentation.xml.rels', pres_rels)
        z.writestr('ppt/theme/theme1.xml', theme_xml)
        z.writestr('ppt/slideMasters/slideMaster1.xml', master_xml)
        z.writestr('ppt/slideMasters/_rels/slideMaster1.xml.rels', master_rels)
        z.writestr('ppt/slideLayouts/slideLayout1.xml', layout_xml)
        z.writestr('ppt/slideLayouts/_rels/slideLayout1.xml.rels', layout_rels)
        
        for idx, shapes in enumerate(slides_data, start=1):
            sp_tree_content = "\n".join(shapes)
            slide_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      {sp_tree_content}
    </p:spTree>
  </p:cSld>
</p:sld>"""
            z.writestr(f'ppt/slides/slide{idx}.xml', slide_xml)
            z.writestr(f'ppt/slides/_rels/slide{idx}.xml.rels', slide_rels)

    print(f"✅ Generated {output_pptx} with {len(slides_data)} slides!")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), '..', 'FairShare_Architecture_and_Tech_Stack.pptx')
    build_presentation(os.path.abspath(target))

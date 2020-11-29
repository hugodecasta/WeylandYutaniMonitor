# [Weyland-Yutani IO](https://weyland-yutani.io)
Weyland-Yutani IO communication system

## Principles

The WY Monitor OS allows multiple distant entities (HQ, colonial bases, planetary detention complex, etc.) to communicate using Secured Communication Beams.

Any entity can connect to any known beam using a `beam name` and `beam code`.\
Once connected, the entity can recieve and send direct messages trough the beam using its `personal id`.\
All messages are stored in a secure database accessible via the `beam name` and `code` (Old and unread messages can be accessed).

The WY Monitor OS requires at least one beam to be connected.

Make sure to keep you beam access codes in case of a beam disconnection.

## Usage
- H : CALL HELP
- ESCAPE : "EXIT" - DISCONNECT FROM ALL BEAMS
- B : "REGISTER_BEAM" - REGISTER NEW BEAM
- D : "DISCONNECT_BEAM" - DISCONNECT BEAM
- C : "CHECK_BEAM_MESSAGES" - CHECK ONE BEAM MESSAGES
- V : "CHECK_ALL_BEAM_MESSAGES" - CHECK UN-READ MESSAGES FROM ALL BEAMS
- F : "BEAM_FILE" - LOAD BEAM FILE DATA
- SHIFT : "DISPLAY_BEAMS" - DISPLAY REGISTERED BEAMS
- ENTER : "SEND_MESSAGE" - SEND MESSAGE TROUGH A BEAM
 
(Input commands can be canceled using `CTRL`+ `c`)

## Inspiration
 * [FIORINA PRISON CLOSING REPORT](https://youtu.be/CrHSw3Fx8H4?t=633)
 * [SUPT.ANDREWS MS51021](https://youtu.be/bQtqq5dNCiE?t=163)

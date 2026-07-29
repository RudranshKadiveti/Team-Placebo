from pathlib import Path

app_path = Path(r"c:\Users\RUDRANSH\OneDrive - Manipal Academy of Higher Education\Desktop\agent-scraper\ui\app.py")
content = app_path.read_text(encoding="utf-8")

lines = content.splitlines()

# Find the start of the block
start_idx = -1
for i, line in enumerate(lines):
    if line == '        if start_button:':
        start_idx = i
        break

# Find the end of the block (before `with tab_history:`)
end_idx = -1
for i, line in enumerate(lines):
    if line == '    with tab_history:':
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_block = """        if start_button:
            target_url, is_valid = clean_and_validate_url(target_url_input)
            
            if not target_url or not is_valid:
                st.error("Invalid URL format. Please paste a clean web URL (e.g., `https://www.amazon.in/s?k=iphone+17+pro`).")
            else:
                # Build EngineConfig from UI parameters
                config = EngineConfig(
                    headless=headless_mode,
                    proxy_server=proxy_server if proxy_server.strip() else None,
                    user_agent=user_agent if user_agent.strip() else None
                )

                scraper = ModularScraper(config=config)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

                if scrape_mode == "Direct Scrape":
                    with st.spinner("⏳ Running Direct Scrape via Headless Engine..."):
                        try:
                            raw_text = run_async_task(scraper.run_direct_scrape(target_url))
                            
                            # Save record to Database
                            record_id = save_scrape_record(
                                url=target_url,
                                mode="Direct Scrape",
                                raw_text=raw_text,
                                summary=f"Direct text scrape of {target_url}"
                            )
                            
                            st.session_state.current_scrape = {
                                "mode": "Direct Scrape",
                                "raw_text": raw_text,
                                "target_url": target_url,
                                "timestamp": timestamp,
                                "record_id": record_id
                            }
                        except Exception as e:
                            st.error(f"Scraping Error: {str(e)}")

                elif scrape_mode == "Agentic Scrape":
                    if not prompt.strip():
                        st.warning("Please provide an Intent Prompt for Agentic Scrape.")
                    elif not effective_api_key:
                        st.error("Gemini API Key is missing. Please set `GEMINI_API_KEY` in your `.env` file or enter it in the sidebar.")
                    else:
                        with st.spinner(f"🤖 Executing Agentic Scrape (Browser Extraction + {gemini_model} Structuring)..."):
                            try:
                                result = run_async_task(
                                    scraper.run_agentic_scrape(
                                        url=target_url,
                                        prompt=prompt,
                                        gemini_api_key=effective_api_key,
                                        model_name=gemini_model
                                    )
                                )
                                
                                result_dict = result.to_dict()
                                
                                # Save record to Database
                                record_id = save_scrape_record(
                                    url=target_url,
                                    mode="Agentic Scrape",
                                    prompt=prompt,
                                    summary=result.summary,
                                    results=result_dict.get("results", {})
                                )
                                
                                st.session_state.current_scrape = {
                                    "mode": "Agentic Scrape",
                                    "result_dict": result_dict,
                                    "summary": result.summary,
                                    "results": result.results,
                                    "target_url": target_url,
                                    "timestamp": timestamp,
                                    "record_id": record_id
                                }
                            except Exception as e:
                                st.error(f"Agentic Scraping Error: {str(e)}")

        if "current_scrape" in st.session_state:
            scrape_data = st.session_state.current_scrape
            
            if scrape_data["mode"] == "Direct Scrape":
                st.success("Direct scrape completed successfully!")
                st.caption(f"💾 Saved record to Database (ID: `{scrape_data['record_id']}`)")

                st.subheader("📄 Raw Extracted Text")
                raw_text = scrape_data['raw_text']
                target_url = scrape_data['target_url']
                timestamp = scrape_data['timestamp']
                
                st.code(raw_text[:2000] + ("\\n... [truncated for display]" if len(raw_text) > 2000 else ""), language="text")

                # Download options
                st.markdown("---")
                st.subheader("💾 Export Options")
                
                format_type = st.selectbox(
                    "Select Export Format:",
                    options=["Text (.txt)", "Markdown (.md)", "JSON (.json)", "CSV (.csv)", "Terraform (.tf)"],
                    key="direct_format_select"
                )
                
                if format_type == "Text (.txt)":
                    st.download_button("📥 Download Text File", data=raw_text, file_name=f"direct_{timestamp}.txt", mime="text/plain")
                elif format_type == "Markdown (.md)":
                    md_str = f"# Direct Scrape Output\\n\\n**URL:** [{target_url}]({target_url})\\n\\n```text\\n{raw_text}\\n```"
                    st.download_button("📝 Download Markdown File", data=md_str, file_name=f"direct_{timestamp}.md", mime="text/markdown")
                elif format_type == "JSON (.json)":
                    json_str = json.dumps({"url": target_url, "raw_text": raw_text}, indent=2)
                    st.download_button("📥 Download JSON File", data=json_str, file_name=f"direct_{timestamp}.json", mime="application/json")
                elif format_type == "CSV (.csv)":
                    csv_str = generate_csv_data({"raw_text": raw_text[:5000]})
                    st.download_button("📊 Download CSV File", data=csv_str, file_name=f"direct_{timestamp}.csv", mime="text/csv")
                elif format_type == "Terraform (.tf)":
                    tf_str = generate_terraform_data(f"Direct Scrape of {target_url}", {"raw_text_snippet": raw_text[:500]}, target_url)
                    st.download_button("🏗️ Download Terraform File", data=tf_str, file_name=f"direct_{timestamp}.tf", mime="text/plain")

            elif scrape_data["mode"] == "Agentic Scrape":
                st.success("Agentic scrape completed successfully!")
                st.caption(f"💾 Saved record to Database (ID: `{scrape_data['record_id']}`)")
                
                result_dict = scrape_data["result_dict"]
                target_url = scrape_data["target_url"]
                timestamp = scrape_data["timestamp"]
                summary = scrape_data["summary"]
                results = scrape_data["results"]

                st.subheader("📊 Structured JSON Result")
                st.json(result_dict)

                with st.expander("📝 Summary", expanded=True):
                    st.write(summary)

                # Formatted Exports
                json_data = json.dumps(result_dict, indent=2)
                csv_data = generate_csv_data(results)
                md_data = generate_markdown_data(summary, results, target_url)
                tf_data = generate_terraform_data(summary, results, target_url)
                txt_data = f"SUMMARY:\\n{summary}\\n\\nEXTRACTED DATA:\\n{json_data}"

                # Format Selector UI
                st.markdown("---")
                st.subheader("💾 Export Data")
                
                sel_col1, sel_col2 = st.columns([1, 1])
                
                with sel_col1:
                    export_format = st.selectbox(
                        "Choose Download Format:",
                        options=[
                            "CSV Spreadsheet (.csv)", 
                            "JSON (.json)", 
                            "Text Summary (.txt)", 
                            "Markdown Report (.md)", 
                            "Terraform (.tf)"
                        ],
                        index=0
                    )
                
                with sel_col2:
                    st.write("") # spacing
                    st.write("")
                    if export_format == "CSV Spreadsheet (.csv)":
                        st.download_button("📊 Download CSV File", data=csv_data, file_name=f"scrape_{timestamp}.csv", mime="text/csv", use_container_width=True)
                    elif export_format == "JSON (.json)":
                        st.download_button("📥 Download JSON File", data=json_data, file_name=f"scrape_{timestamp}.json", mime="application/json", use_container_width=True)
                    elif export_format == "Text Summary (.txt)":
                        st.download_button("📄 Download Text File", data=txt_data, file_name=f"scrape_{timestamp}.txt", mime="text/plain", use_container_width=True)
                    elif export_format == "Markdown Report (.md)":
                        st.download_button("📝 Download Markdown File", data=md_data, file_name=f"scrape_{timestamp}.md", mime="text/markdown", use_container_width=True)
                    elif export_format == "Terraform (.tf)":
                        st.download_button("🏗️ Download Terraform File", data=tf_data, file_name=f"scrape_{timestamp}.tf", mime="text/plain", use_container_width=True)

"""
    lines[start_idx:end_idx] = new_block.splitlines()
    app_path.write_text("\\n".join(lines) + "\\n", encoding="utf-8")
    print("Patch applied successfully.")
else:
    print("Could not find blocks.")

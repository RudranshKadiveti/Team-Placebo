import re
from pathlib import Path

app_path = Path(r"c:\Users\RUDRANSH\OneDrive - Manipal Academy of Higher Education\Desktop\agent-scraper\ui\app.py")
content = app_path.read_text(encoding="utf-8")

# Let's replace the if start_button block up to the start of Direct Scrape
pattern_start = r'(\s*)if start_button:(.*?)if scrape_mode == "Direct Scrape":'
replacement_start = r'''\1if start_button:
\1    target_url, is_valid = clean_and_validate_url(target_url_input)
\1    
\1    if not target_url or not is_valid:
\1        st.error("Invalid URL format. Please paste a clean web URL (e.g., `https://www.amazon.in/s?k=iphone+17+pro`).")
\1    else:
\1        # Build EngineConfig from UI parameters
\1        config = EngineConfig(
\1            headless=headless_mode,
\1            proxy_server=proxy_server if proxy_server.strip() else None,
\1            user_agent=user_agent if user_agent.strip() else None
\1        )
\1
\1        scraper = ModularScraper(config=config)
\1        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
\1
\1        if scrape_mode == "Direct Scrape":'''

new_content = re.sub(pattern_start, replacement_start, content, flags=re.DOTALL)

# Now find the end of Direct Scrape execution and replace the rendering part to use session_state
pattern_direct = r'raw_text = run_async_task\(scraper\.run_direct_scrape\(target_url\)\)\n(\s*)st\.success\("Direct scrape completed successfully!"\)\n(.*?)st\.download_button\("🏗️ Download Terraform File"[^\n]+\n\n(\s*)except Exception as e:'

replacement_direct = r'''raw_text = run_async_task(scraper.run_direct_scrape(target_url))
\1    
\1    # Save record to Database
\1    record_id = save_scrape_record(
\1        url=target_url,
\1        mode="Direct Scrape",
\1        raw_text=raw_text,
\1        summary=f"Direct text scrape of {target_url}"
\1    )
\1    
\1    st.session_state.current_scrape = {
\1        "mode": "Direct Scrape",
\1        "raw_text": raw_text,
\1        "target_url": target_url,
\1        "timestamp": timestamp,
\1        "record_id": record_id
\1    }
\3except Exception as e:'''

new_content = re.sub(pattern_direct, replacement_direct, new_content, flags=re.DOTALL)

# Now Agentic Scrape
pattern_agentic = r'result = run_async_task\([\s\S]*?model_name=gemini_model\n\s*\)\n\s*\)\n(\s*)st\.success\("Agentic scrape completed successfully!"\)\n(.*?)st\.download_button\("🏗️ Download Terraform File"[^\n]+\n\n(\s*)except Exception as e:'

replacement_agentic = r'''result = run_async_task(
                                    scraper.run_agentic_scrape(
                                        url=target_url,
                                        prompt=prompt,
                                        gemini_api_key=effective_api_key,
                                        model_name=gemini_model
                                    )
                                )
\1    
\1    result_dict = result.to_dict()
\1    
\1    # Save record to Database
\1    record_id = save_scrape_record(
\1        url=target_url,
\1        mode="Agentic Scrape",
\1        prompt=prompt,
\1        summary=result.summary,
\1        results=result_dict.get("results", {})
\1    )
\1    
\1    st.session_state.current_scrape = {
\1        "mode": "Agentic Scrape",
\1        "result_dict": result_dict,
\1        "summary": result.summary,
\1        "results": result.results,
\1        "target_url": target_url,
\1        "timestamp": timestamp,
\1        "record_id": record_id
\1    }
\3except Exception as e:'''

new_content = re.sub(pattern_agentic, replacement_agentic, new_content, flags=re.DOTALL)

# Now we need to append the rendering block outside the `if start_button:` block.
# We will insert it right before `with tab_history:`
render_code = r'''
        if "current_scrape" in st.session_state:
            scrape_data = st.session_state.current_scrape
            
            if scrape_data["mode"] == "Direct Scrape":
                st.success("Direct scrape completed successfully!")
                st.caption(f"💾 Saved record to Database (ID: `{scrape_data['record_id']}`)")

                st.subheader("📄 Raw Extracted Text")
                raw_text = scrape_data['raw_text']
                target_url = scrape_data['target_url']
                timestamp = scrape_data['timestamp']
                
                st.code(raw_text[:2000] + ("\n... [truncated for display]" if len(raw_text) > 2000 else ""), language="text")

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
                    md_str = f"# Direct Scrape Output\n\n**URL:** [{target_url}]({target_url})\n\n```text\n{raw_text}\n```"
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
                txt_data = f"SUMMARY:\n{summary}\n\nEXTRACTED DATA:\n{json_data}"

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

    with tab_history:'''

new_content = new_content.replace("    with tab_history:", render_code)

app_path.write_text(new_content, encoding="utf-8")
print("Successfully patched ui/app.py")

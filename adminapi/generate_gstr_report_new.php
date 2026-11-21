<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
include('../../newbtconnect/vendor/autoload.php');
include("../../connect.php");
$response = array();
$bthawk=768;
if($bthawk!="")
{
	date_default_timezone_set('Asia/Calcutta');
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	// $ver=$_POST['distributor_id'];
	// $cmonth=$_POST['cmonth'];
	// $cyear=$_POST['cyear']; 

	$ver=4496;
	$cmonth='08';
	$cyear='2023'; 
	// require '../PHPMailer-master/PHPMailerAutoload.php';
	date_default_timezone_set('Asia/Calcutta');
	$cdate11  = date("Y-m-d");
	$cdate12  = date("H:i:sa");
	
	$res_search_year = mysqli_query($con,"select previous_record_date from tbl_distributor_previous_data_record");
	$a21_year=mysqli_fetch_array($res_search_year);
	$check_datetable  =$a21_year['previous_record_date'];
	
	$flag_count=0;
	if(strlen($cmonth)==1)
		$cmonth="0".$cmonth;
	$res_detail = mysqli_query($con,"select * from tbl_distributor_gst_report where distributor_id='$ver' and month='$cmonth' and year='$cyear'");
	if(mysqli_num_rows($res_detail)<=0)
	{
		$resd1 = mysqli_query($con,"INSERT INTO `tbl_distributor_gst_report`(`distributor_id`, `month`, `year`, `insert_date`, `insert_time`,`mail_count`) VALUES ('$ver','$cmonth','$cyear','$cdate11','$cdate12','1')");
		$flag_count=1;
	}
	else
	{
		while($fetch_product=mysqli_fetch_assoc($res_detail))
		{
			$mail_count_val=$fetch_product['mail_count'];
		}
		if($mail_count_val<5)
		{
			$mail_count_val=$mail_count_val+1;
			$resd1 = mysqli_query($con,"update `tbl_distributor_gst_report` set `mail_count`='$mail_count_val' where distributor_id='$ver' and month='$cmonth' and year='$cyear'");
			$flag_count=1;
		}
	}
	if($flag_count==1)
	{
		$client_gst_type='GST';
		$res_search = mysqli_query($con,"select * from tbl_distributor where distributor_id='$ver'");
		$row_search  = mysqli_num_rows($res_search);
		$a21=mysqli_fetch_array($res_search);
		$flag_done=1;
		if($row_search>0)
		{
			if($a21['country']!="India")
				$client_gst_type='VAT';
			$dis_name=$a21['distributor_name'];
			$dis_email=$a21['distributor_email'];
			
			$csv_filename1 = '../distributor_gstr_report/'.'B2C_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			$csv_filename2 = '../distributor_gstr_report/'.'GSTR_3B_summary_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			$csv_filename3 = '../distributor_gstr_report/'.'B2B_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			$csv_filename4 = '../distributor_gstr_report/'.'HSNWise_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			$csv_filename5 = '../distributor_gstr_report/'.'GSTR_3B_sale_detail_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			$csv_filename6 = '../distributor_gstr_report/'.'Document_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			$csv_filename7 = '../distributor_gstr_report/'.'Document_Bill_Cancel_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			$csv_filename8 = '../distributor_gstr_report/'.'GSTR1_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';

			if(strlen($cmonth)==1)
				$cmonth="0".$cmonth;
			$start_date=$cyear."-".$cmonth."-01";
			$end_date=$cyear."-".$cmonth."-31";
			if(($cmonth=='06' || $cmonth=='09' || $cmonth=='12' || $cmonth=='03'))
			{
				$csv_filename15 = '../distributor_gstr_report/'.'Quarterly_GSTR_3B_Summary_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
				$csv_filename9 = '../distributor_gstr_report/'.'Quarterly_B2C_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
				$csv_filename10 = '../distributor_gstr_report/'.'Quarterly_B2B_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
				$csv_filename11 = '../distributor_gstr_report/'.'Quarterly_HSNWise_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
				$csv_filename12 = '../distributor_gstr_report/'.'Quarterly_Document_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
				$csv_filename13 = '../distributor_gstr_report/'.'Quarterly_Document_Bill_Cancel_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
				$csv_filename14 = '../distributor_gstr_report/'.'Quarterly_GSTR1_Report_'.date('Y-m-d H:i:sa').'_'.$cmonth.'_'.$ver.'.csv';
			}	
			
			if($start_date>='2017-01-01' && $end_date<='2020-11-30')
			{
				$extra_link1='tbl_party_transaction_bkp_12112020';
				$extra_link2='tbl_party_transaction_detail_bkp_12112020';
				$extra_link3='gst_reports_jan2018_bkp_12112020';
			}
			else if($start_date>='2020-12-01' && $end_date<='2022-03-31')
			{
				$extra_link1='tbl_party_transaction_31032022';
				$extra_link2='tbl_party_transaction_detail_31032022';
				$extra_link3='gst_reports_jan2018';
			}
			else if($start_date>='2022-04-01')
			{
				$extra_link1='tbl_party_transaction';
				$extra_link2='tbl_party_transaction_detail';
				$extra_link3='gst_reports_jan2018';
			}


			if(($cmonth=='06' || $cmonth=='09' || $cmonth=='12' || $cmonth=='03'))
			{
				$fp15 = fopen($csv_filename15, 'w');
				if($client_gst_type=='GST') {
					fputcsv($fp15, array('Purchase Taxable Value','Central Tax','State Tax','Integrated Tax','Total Purchase'));
				}
				else
				{
					fputcsv($fp15, array('Purchase Taxable Value','VAT Tax','Total Purchase'));
				}
				
				
				$query1=mysqli_query($con,"select *  from tbl_distributor_transaction,tbl_purchase_party,tbl_product where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date>='$start_date' and tbl_distributor_transaction.bill_date<='$end_date' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') and tbl_distributor_transaction.conversion='' order by tbl_distributor_transaction.id ASC");
				if(mysqli_num_rows($query1)>0)
				{
					while($fetch_product2=mysqli_fetch_assoc($query1))
					{
						$total_cess=$total_cess+$fetch_product2['cess_amt'];
						$total_cgst=$total_cgst+$fetch_product2['cgst_amt'];
						$total_sgst=$total_sgst+$fetch_product2['sgst_amt'];
						$total_igst=$total_igst+$fetch_product2['igst_amt'];
						$total_final_net_amt=$total_final_net_amt+$fetch_product2['final_net_amt'];
						$temp_txn_id=$fetch_product2['transaction_id'];
						$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
						while($pro_fetch_return=mysqli_fetch_array($product_return)) 
						{ 
							$return_cgst_amt=$return_cgst_amt+$pro_fetch_return['return_cgst_amt'];
							$return_sgst_amt=$return_sgst_amt+$pro_fetch_return['return_sgst_amt'];
							$return_igst_amt=$return_igst_amt+$pro_fetch_return['return_igst_amt'];
							$return_net_amt=$return_net_amt+$pro_fetch_return['return_net_amt'];
							$return_cess_amt=$return_cess_amt+$pro_fetch_return['return_cess_amt'];
						}
					}											
					$total_txn_amt=round($total_final_net_amt-$return_net_amt,2)-round($total_cgst-$return_cgst_amt,2)-round($total_sgst-$return_sgst_amt,2)-round($total_igst-$return_igst_amt,2)-round($total_cess-$return_cess_amt,2);
					if($client_gst_type=='GST') {
						fputcsv($fp15, array($total_txn_amt,round($total_cgst-$return_cgst_amt,2),round($total_sgst-$return_sgst_amt,2),round($total_igst-$return_igst_amt,2),round($total_cess-$return_cess_amt,2),round($total_final_net_amt-$return_net_amt,2)));
					}
					else
					{
						fputcsv($fp15, array($total_txn_amt,round($total_cgst-$return_cgst_amt+$total_sgst-$return_sgst_amt+$total_igst-$return_igst_amt,2),round($total_cess-$return_cess_amt,2),round($total_final_net_amt-$return_net_amt,2)));
					}
				}
				else
				{
					if($client_gst_type=='GST')
						fputcsv($fp15, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
					else
						fputcsv($fp15, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				}
				$final_tds_amt=0;
				$final_total_amount=0;
				$final_disc_amt=0;
				if($client_gst_type=='GST') 
					fputcsv($fp15, array('Total Taxable Sale Value','Central Tax','State Tax','Integrated Tax','Cess','Total Sale'));
				else
					fputcsv($fp15, array('Total Taxable Sale Value','VAT Tax','Cess','Total Sale'));
				$query11=mysqli_query($con,"SELECT hsn_code,SUM(total_sale) as total_sale,SUM(total_cgst_amt) as total_cgst_amt,SUM(total_sgst_amt) as total_sgst_amt,SUM(total_igst_amt) as total_igst_amt,SUM(total_cess_amt) as total_cess_amt  FROM  ".$extra_link3." where distributor_id='$ver' and transaction_date>='$start_date' and transaction_date<='$end_date' and bill_type in ('Tax Invoice','Payout','Both')");
				if(mysqli_num_rows($query11)>0)
				{
					while($fetch_product2=mysqli_fetch_assoc($query11))
					{
						if($ver=="1018")
						{
							$query_tds=mysqli_query($con,"SELECT SUM(tds_amt) as total_tds,SUM(total_amount) as total_amount,SUM(disc_amt) as total_disc_amt FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both')");
							while($fetch_tds=mysqli_fetch_assoc($query_tds))
							{
								$final_tds_amt=$fetch_tds['total_tds'];
								$final_total_amount=$fetch_tds['total_amount'];
								$final_disc_amt=$fetch_tds['total_disc_amt'];
							}
						}
						if($ver=="1018")
						{ 
							fputcsv($fp15, array($final_total_amount-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$final_tds_amt-$fetch_product2['total_igst_amt']-$final_disc_amt,round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2),$final_total_amount-$final_tds_amt-$final_disc_amt));	
						}
						else
						{
							if($client_gst_type=='GST')
								fputcsv($fp15, array(round($fetch_product2['total_sale'],2)-round($fetch_product2['total_cgst_amt'],2)-round($fetch_product2['total_sgst_amt'],2)-round($fetch_product2['total_igst_amt'],2)-round($fetch_product2['total_cess_amt'],2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2),round($fetch_product2['total_sale'],2)));	
							else
								fputcsv($fp15, array(round($fetch_product2['total_sale'],2)-round($fetch_product2['total_cgst_amt'],2)-round($fetch_product2['total_sgst_amt'],2)-round($fetch_product2['total_igst_amt'],2)-round($fetch_product2['total_cess_amt'],2),round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2),round($fetch_product2['total_sale'],2)));
						}
					}	
				}
				else
				{
					if($client_gst_type=='GST')
						fputcsv($fp15, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
					else
						fputcsv($fp15, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				}
				fclose($fp15); 
			}
			/*GSTR1 deatil Report    */	
			$fp8 = fopen($csv_filename8, 'w');
			fputcsv($fp8, array('Summary For B2B(4)'));
			fputcsv($fp8, array('No of Recipients','','No of Invoices','','Total Invoice Value','','','','','','','Total Taxable Value','Total Cess'));
			$final_total_gstin=0;
			$total_gstin_no=mysqli_query($con,"select ".$extra_link1.".transaction_id from ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin NOT IN ('','NA') group by tbl_party.gstin_no");
			$final_total_gstin= mysqli_num_rows($total_gstin_no);	

			$invoices_count=0;
			$total_invoice_value=0;
			$total_cess_value=0;
			$total_taxable_value=0;
			$total_bill=mysqli_query($con,"select * from ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin NOT IN ('','NA')");
			while($fetch_total_bill_data=mysqli_fetch_assoc($total_bill))
			{
				$invoices_count++;
				$dist_gst_configure=$fetch_total_bill_data['gst_configure'];
				$total_cess_value=$total_cess_value+$fetch_total_bill_data['cess_amount'];
				$trans_id=$fetch_total_bill_data['transaction_id'];
				$res_data = mysqli_query($con,"select *,".$extra_link2.".product_price as pprice from ".$extra_link2.",tbl_product where ".$extra_link2.".product_id=tbl_product.product_id and ".$extra_link2.".transaction_id='$trans_id'");
				while($fetch_product_bill_detail=mysqli_fetch_assoc($res_data))
				{
					if($ver=="1018")
					{ 
						$total_invoice_value=$total_invoice_value+($fetch_total_bill_data['total_amount']-$fetch_total_bill_data['disc_amt']-$fetch_total_bill_data['tds_amt']);
						$total_taxable_value=$total_taxable_value+($fetch_total_bill_data['total_amount']-$fetch_total_bill_data['disc_amt']-$fetch_total_bill_data['tds_amt']-$fetch_product_bill_detail['CGST_amount']-$fetch_product_bill_detail['SGST_amount']-$fetch_product_bill_detail['IGST_amount']);
					}
					else if($fetch_product_bill_detail['cess_calculation']=='Inclusive')
					{
						if($dist_gst_configure=="Inclusive") { 
							$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']));
							$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['CGST_amount']-$fetch_product_bill_detail['SGST_amount']-$fetch_product_bill_detail['IGST_amount']-$fetch_product_bill_detail['product_disc']-$fetch_product_bill_detail['cess_final_amt']),2);
						}
						else
						{
							$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']+$fetch_product_bill_detail['CGST_amount']+$fetch_product_bill_detail['SGST_amount']+$fetch_product_bill_detail['IGST_amount']));
							$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']-$fetch_product_bill_detail['cess_final_amt']),2);
						}
					}
					else
					{
						if($dist_gst_configure=="Inclusive") { 
							$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']+$fetch_product_bill_detail['cess_final_amt']));
							$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['CGST_amount']-$fetch_product_bill_detail['SGST_amount']-$fetch_product_bill_detail['IGST_amount']-$fetch_product_bill_detail['product_disc']),2);
						}
						else
						{
							$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']+$fetch_product_bill_detail['CGST_amount']+$fetch_product_bill_detail['SGST_amount']+$fetch_product_bill_detail['IGST_amount']+$fetch_product_bill_detail['cess_final_amt']));
							$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']),2);
						}
					}
				}
			}
			fputcsv($fp8, array($final_total_gstin,'',$invoices_count,'',round($total_invoice_value,2),'','','','','','',round($total_taxable_value,2),round($total_cess_value,2)));

			fputcsv($fp8, array('GSTIN/UIN of Recipient','Receiver Name','Invoice Number','Invoice Date','Invoice Value','Place Of Supply','Reverse Charge','Applicable % of Tax Rate','Invoice Type','E-Commerce GSTIN','Rate','Taxable Value','Cess Amount'));
			$query111=mysqli_query($con,"select * from ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin NOT IN ('','NA')");
			while($fetch_product2=mysqli_fetch_assoc($query111))
			{
				$bill_date=$fetch_product2['bill_date'];
				if ($fetch_product2['party_name']=="Bharti Hexacom Limited" || $fetch_product2['party_name']=="Airtel Payments Bank" || $fetch_product2['party_name']=="BHARTI TELEMEDIA LTD" || $fetch_product2['party_name']=="Bharti Airtel LTD" || $fetch_product2['party_name']=="AIRTEL PAYMENT BANK DELHI")
				{	
					$bill_no=$fetch_product2['txn_id'];
				}
				else
				{
					$bill_no=$fetch_product2['transaction_bill_number'];
				}
				$gstin_no=$fetch_product2['party_gstin'];
				$place_of_supply=$fetch_product2['place_of_supply'];
				$party_code=$fetch_product2['party_code'];
				$party_name=$fetch_product2['party_name'];
				$total_amount=$fetch_product2['total_amount'];
				$final_amt=$fetch_product2['final_amt'];
				$disc_amt=$fetch_product2['disc_amt'];
				$tds_amt=$fetch_product2['tds_amt'];
				$trans_id=$fetch_product2['transaction_id'];
				$dist_gst_configure=$fetch_product2['gst_configure'];	
				$total_bill_tax_val=0;
				$total_bill_invoive_val=0;		
				$res1 = mysqli_query($con,"select *,".$extra_link2.".product_price as pprice from ".$extra_link2.",tbl_product where ".$extra_link2.".product_id=tbl_product.product_id and ".$extra_link2.".transaction_id='$trans_id'");
				while($fetch_product3=mysqli_fetch_assoc($res1))
				{
					if($ver=="1018")
					{ 
						$total_bill_invoive_val=$total_bill_invoive_val+($total_amount-$disc_amt-$tds_amt);
						$total_bill_tax_val=$total_bill_tax_val+($total_amount-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-$disc_amt-$tds_amt);
						fputcsv($fp8, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),$total_amount-$disc_amt-$tds_amt,$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],$total_amount-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-$disc_amt-$tds_amt,round($fetch_product3['cess_final_amt'],2)));		
					}
					else if($fetch_product_bill_detail['cess_calculation']=='Inclusive')
					{
						if($dist_gst_configure=="Inclusive") 
						{ 
							$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc'],2);
							$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc'],2)-round($fetch_product3['cess_final_amt'],2);
							fputcsv($fp8, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc'],2)-round($fetch_product3['cess_final_amt'],2),round($fetch_product3['cess_final_amt'],2)));	
						}
						else
						{
							$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2);
							$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc'],2)-round($fetch_product3['cess_final_amt'],2);
							fputcsv($fp8, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc'],2)-round($fetch_product3['cess_final_amt'],2),round($fetch_product3['cess_final_amt'],2)));
						}
					}
					else
					{
						if($dist_gst_configure=="Inclusive") 
						{ 
							$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt'],2);
							$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc'],2);
							fputcsv($fp8, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc'],2),round($fetch_product3['cess_final_amt'],2)));	
						}
						else
						{
							$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2);
							$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc'],2);
							fputcsv($fp8, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc'],2),round($fetch_product3['cess_final_amt'],2)));
						}
					}
				}	
				fputcsv($fp8, array('Total','-','-','-',$total_bill_invoive_val,'-','-','-','-','-','-',$total_bill_tax_val,'-'));
			}

			fclose($fp8); 
			/* End GSTR1 deatil Report    */	

			/*Document deatil Report    */	
			$fp7 = fopen($csv_filename7, 'w');
			fputcsv($fp7, array('#','Code','Receiver Name','Invoice No.','Invoice Date','Quantity','Rate(%)','Amount','Type'));
			$res = "select * from tbl_bill_cancel,tbl_party,tbl_user where tbl_bill_cancel.transaction_to=tbl_party.party_id and tbl_bill_cancel.transaction_from=tbl_user.user_id and tbl_bill_cancel.transaction_date>='$start_date' and tbl_bill_cancel.transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and tbl_bill_cancel.bill_type in ('Tax Invoice','Payout','Both')";
			$query1=mysqli_query($con,$res); 
			if(mysqli_num_rows($query1)>0)
			{
				$c=1; 
				while($fetch_product2=mysqli_fetch_assoc($query1))
				{
					$bill_date=$fetch_product2['transaction_date'];
					$bill_no=$fetch_product2['transaction_bill_number'];
					$sale_type=$fetch_product2['payment_mode'];
					$party_name=$fetch_product2['party_name'];
					$party_phone=$fetch_product2['party_phone'];
					$mc_name=$fetch_product2['user_phone'];
					$trans_id=$fetch_product2['transaction_id'];
					$dist_gst_configure=$fetch_product2['gst_configure'];
					$res1 = mysqli_query($con,"select *,tbl_bill_cancel_detail.product_price as saleprice from tbl_bill_cancel_detail,tbl_product where tbl_bill_cancel_detail.product_id=tbl_product.product_id and tbl_bill_cancel_detail.transaction_id='$trans_id'");
					while($fetch_product3=mysqli_fetch_array($res1))
					{
						$p_nm=$party_name." - ".$party_phone;
						if($dist_gst_configure=="Inclusive")
							$txn_rate=$fetch_product3['saleprice']/((100+$fetch_product3['CGST']+$fetch_product3['SGST'])/100);
						else 
							$txn_rate= $fetch_product3['saleprice'];

						if($ver=="1018")
						{
							$net=$fetch_product2['total_amount']-$fetch_product2['tds_amt']-$fetch_product3['product_disc'];	
						}
						else if($fetch_product3['cess_calculation']=='Inclusive')
						{
							if($dist_gst_configure=="Inclusive")
								$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])-$fetch_product3['product_disc'],4);
							else
								$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])-$fetch_product3['product_disc']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],4);
						}
						else
						{ 
							if($dist_gst_configure=="Inclusive")
								$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])+$fetch_product3['cess_final_amt']-$fetch_product3['product_disc'],4);
							else
								$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],4);
						}
						if($sale_type=="Cheque"){ $sale_type="Credit"; }
						fputcsv($fp7, array($c,$mc_name,$p_nm,$bill_no,$bill_date,$fetch_product3['quantity'],round($txn_rate,5),$net,$sale_type));
						$c++;		
					} 

				}
			}
			else
			{
				fputcsv($fp7, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
			}

			fclose($fp7); 
			/* End Document deatil Report    */	

			/*Document Report   */	
			$fp6 = fopen($csv_filename6, 'w');
			fputcsv($fp6, array('Sr.No. - From','Sr.No. - To','Total Number','Cancelled'));

			$start_detail=$end_detail='';

			$bill_start=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date' AND ".$extra_link1.".transaction_date<='$end_date' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Self' ORDER BY ".$extra_link1.".transaction_bill_number ASC LIMIT 0,1");
			if(mysqli_num_rows($bill_start)>0)
			{
				$fetch_start_data=mysqli_fetch_assoc($bill_start);
				$start_detail=$fetch_start_data['transaction_bill_number'];
			}
			$bill_start1=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date' AND ".$extra_link1.".transaction_date<='$end_date' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Auto' ORDER BY ".$extra_link1.".transaction_bill_number ASC LIMIT 0,1");
			if(mysqli_num_rows($bill_start1)>0)
			{
				$fetch_start_data1=mysqli_fetch_assoc($bill_start1);
				$start_detail=$start_detail.' - '.$fetch_start_data1['transaction_bill_number'];
			}
			$bill_end=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date' AND ".$extra_link1.".transaction_date<='$end_date' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Self' ORDER BY ".$extra_link1.".transaction_bill_number DESC LIMIT 0,1");
			if(mysqli_num_rows($bill_end)>0)
			{
				$fetch_end_data=mysqli_fetch_assoc($bill_end);
				$end_detail=$fetch_end_data['transaction_bill_number'];
			}
			$bill_end1=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date' AND ".$extra_link1.".transaction_date<='$end_date' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Auto' ORDER BY ".$extra_link1.".transaction_bill_number DESC LIMIT 0,1");
			if(mysqli_num_rows($bill_end1)>0)
			{
				$fetch_end_data1=mysqli_fetch_assoc($bill_end1);
				$end_detail=$end_detail.' - '.$fetch_end_data1['transaction_bill_number'];
			}
			$total_bill=mysqli_query($con,"SELECT count(transaction_id) as invoices_count FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date' AND ".$extra_link1.".transaction_date<='$end_date' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by=''");
			$fetch_total_bill_data=mysqli_fetch_assoc($total_bill);

			$bill_cancel=mysqli_query($con,"SELECT count(transaction_id) as invoices_count FROM tbl_bill_cancel,tbl_user WHERE tbl_bill_cancel.transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND tbl_bill_cancel.transaction_date>='$start_date' AND tbl_bill_cancel.transaction_date<='$end_date' and tbl_bill_cancel.bill_type in ('Tax Invoice','Payout','Both')");
			$fetch_cancel_data=mysqli_fetch_assoc($bill_cancel);
			$cancel_count=$fetch_cancel_data['invoices_count'];

			fputcsv($fp6, array($start_detail,$end_detail,$fetch_total_bill_data['invoices_count']+$cancel_count,$cancel_count));

			$cdoc=2;
			$bill_start1=mysqli_query($con,"SELECT ".$extra_link1.".txn_id FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date' AND ".$extra_link1.".transaction_date<='$end_date' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by!='' ORDER BY ".$extra_link1.".transaction_id ASC");
			while($fetch_start_data1=mysqli_fetch_assoc($bill_start1)) {
				fputcsv($fp6, array($fetch_start_data1['txn_id'],'','1',''));	
			}	

			fclose($fp6); 
			/* End Document Report    */	

			/*B2B Report    */	
			$fp = fopen($csv_filename1, 'w');
			if($ver=="1018")
				fputcsv($fp, array('Taxable Value','Central Tax','State Tax','Integrated Tax','Cess','Total Sale'));
			else if($client_gst_type=='GST') 
				fputcsv($fp, array('Taxable Value','Rate','Central Tax','State Tax','Integrated Tax','Cess','Total Sale'));
			else 
				fputcsv($fp, array('Taxable Value','Rate','VAT Tax','Cess','Total Sale'));
			$final_flag=0;
			if($ver=="1018")
			{
				$final_tds_amt=0;
				$final_cess_amt=0;
				$final_total_amount=0;
				$final_disc_amt=0;
				$query11=mysqli_query($con,"SELECT SUM(total_sale) as total_sale,SUM(total_cgst_amt) as total_cgst_amt,SUM(total_sgst_amt) as total_sgst_amt,SUM(total_igst_amt) as total_igst_amt,SUM(total_cess_amt) as total_cess_amt FROM  ".$extra_link3." where distributor_id='$ver' and transaction_date>='$start_date' and transaction_date<='$end_date' and gstin_no in ('','NA') and bill_type in ('Tax Invoice','Payout','Both')");
				if(mysqli_num_rows($query11)>0)
				{
					$final_flag=1;
					while($fetch_product2=mysqli_fetch_assoc($query11))
					{
						$final_cess_amt=$fetch_product2['total_cess_amt'];
						$query_tds=mysqli_query($con,"SELECT SUM(tds_amt) as total_tds,SUM(total_amount) as total_amount,SUM(disc_amt) as total_disc_amt FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and tbl_party.gstin_no in ('','NA')");
						while($fetch_tds=mysqli_fetch_assoc($query_tds))
						{
							$final_tds_amt=$fetch_tds['total_tds'];
							$final_total_amount=$fetch_tds['total_amount'];
							$final_disc_amt=$fetch_tds['total_disc_amt'];
						}
						$total_b2c_final= $final_total_amount-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt']-$final_tds_amt-$final_disc_amt;
						$total_sale_final=$final_total_amount-$final_tds_amt-$final_disc_amt;
						fputcsv($fp, array($total_b2c_final,round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($final_cess_amt,2),$total_sale_final));	
					}
				}
			}	
			else
			{	
				$query11=mysqli_query($con,"select sum(round(product_price*quantity,1)) as total_sale,sum(CGST_amount) as total_cgst_amt,SUM(SGST_amount) as total_sgst_amt,SUM(IGST_amount) as total_igst_amt,SUM(cess_final_amt) as total_cess_amt,gst_perc,sum(product_disc) as prodisc  from ".$extra_link2." WHERE transaction_id in (SELECT transaction_id FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin in ('','NA')) group by ".$extra_link2.".gst_perc");	
				if(mysqli_num_rows($query11)>0)
				{ 
					$final_flag=1;
					while($fetch_product2=mysqli_fetch_assoc($query11))
					{		
						$total_b2c_final= round($fetch_product2['total_sale'],2)-round($fetch_product2['total_cgst_amt'],2)-round($fetch_product2['total_sgst_amt'],2)-round($fetch_product2['total_igst_amt'],2)-round($fetch_product2['total_cess_amt'],2)-round($fetch_product2['prodisc'],2); 
						$total_sale_final=round($fetch_product2['total_sale']-$fetch_product2['prodisc'],2);
						if($client_gst_type=='GST') 
							fputcsv($fp, array($total_b2c_final,round($fetch_product2['gst_perc'],2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($final_cess_amt,2),$total_sale_final));	
						else
							fputcsv($fp, array($total_b2c_final,round($fetch_product2['gst_perc'],2),round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($final_cess_amt,2),$total_sale_final));	
					}	
				}
			}
			if($final_flag==0)
			{
				if($ver=="1018")
					fputcsv($fp, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				else if($client_gst_type=='GST') 
					fputcsv($fp, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				else
					fputcsv($fp, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
			}
			fclose($fp); 
			/* End B2B Report    */	

			/**GSTR-3B Report    */	
			$fp5 = fopen($csv_filename5, 'w');
			if($ver==1018)
				fputcsv($fp5, array('Invoice No','Invoice Date-Time','Receiver Name','Taxable Amount','Central Tax','State Tax','Integrated Tax','TDS','Total Amount'));
			else if($client_gst_type=='GST') 
				fputcsv($fp5, array('Invoice No','Invoice Date-Time','Receiver Name','Taxable Amount','Central Tax','State Tax','Integrated Tax','Total Amount'));
			else
				fputcsv($fp5, array('Invoice No','Invoice Date-Time','Receiver Name','Taxable Amount','VAT Tax','Total Amount'));
			$query11=mysqli_query($con,"select ".$extra_link1.".final_amt as total_sale,sum(".$extra_link2.".CGST_amount) as total_cgst_amt,sum(".$extra_link2.".SGST_amount) as total_sgst_amt,sum(".$extra_link2.".IGST_amount) as total_igst_amt,".$extra_link1.".tds_amt,".$extra_link1.".transaction_bill_number,tbl_party.party_name,".$extra_link1.".transaction_date,".$extra_link1.".transaction_time,".$extra_link1.".total_amount,".$extra_link2.".product_disc,sum(".$extra_link2.".cess_final_amt) as total_cess_amt from ".$extra_link1.",tbl_user, ".$extra_link2.", tbl_product,tbl_party where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_id=".$extra_link2.".transaction_id and ".$extra_link2.".product_id=tbl_product.product_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and tbl_product.product_name!='Airtel Money' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') group by ".$extra_link1.".transaction_bill_number,tbl_party.party_name,".$extra_link1.".transaction_date,".$extra_link1.".transaction_time order by ".$extra_link1.".transaction_id desc");
			if(mysqli_num_rows($query11)>0)
			{
				while($fetch_product2=mysqli_fetch_assoc($query11))
				{
					$tax_amount=0;
					if($ver==1018)
					{
						$tax_amount= $fetch_product2['total_amount']-$fetch_product2['tds_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_cgst_amt']-$fetch_product2['total_igst_amt']-$fetch_product2['product_disc'];
						$total_sale_final=$fetch_product2['total_amount']-$fetch_product2['tds_amt']-$fetch_product2['product_disc'];
					}
					else
					{
						$tax_amount=$fetch_product2['total_sale']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt']-$fetch_product2['total_cess_amt'];
						$total_sale_final=round($fetch_product2['total_sale'],2);
					}
					if($ver==1018)
						fputcsv($fp5, array($fetch_product2['transaction_bill_number'],$fetch_product2['transaction_date'].' '.$fetch_product2['transaction_time'],$fetch_product2['party_name'],round($tax_amount,2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),$fetch_product2['tds_amt'],round($total_sale_final,2)));	
					else if($client_gst_type=='GST') 
						fputcsv($fp5, array($fetch_product2['transaction_bill_number'],$fetch_product2['transaction_date'].' '.$fetch_product2['transaction_time'],$fetch_product2['party_name'],round($tax_amount,2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($total_sale_final,2)));
					else
						fputcsv($fp5, array($fetch_product2['transaction_bill_number'],$fetch_product2['transaction_date'].' '.$fetch_product2['transaction_time'],$fetch_product2['party_name'],round($tax_amount,2),round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($total_sale_final,2)));
				}	
			}
			else
			{
				if($ver==1018)
					fputcsv($fp5, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				else if($client_gst_type=='GST') 
					fputcsv($fp5, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				else
					fputcsv($fp5, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
			}
			fclose($fp5); 
			/* End GSTR-3B Report    */	




			/*GSTR1 3B Report    */	
			$fp1 = fopen($csv_filename2, 'w');
			$total_cgst=0;
			$total_sgst=0;
			$total_igst=0;
			$total_final_net_amt=0;
			$return_cgst_amt=0;
			$return_sgst_amt=0;
			$return_igst_amt=0;
			$return_net_amt=0;
			if($client_gst_type=='GST') 
				fputcsv($fp1, array('Purchase Taxable Value','Central Tax','State Tax','Integrated Tax','Total Purchase'));
			else
				fputcsv($fp1, array('Purchase Taxable Value','VAT Tax','Total Purchase'));
			$query1=mysqli_query($con,"select *  from tbl_distributor_transaction,tbl_purchase_party,tbl_product where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date>='$start_date' and tbl_distributor_transaction.bill_date<='$end_date' and tbl_distributor_transaction.conversion='' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') order by tbl_distributor_transaction.id ASC");
			if(mysqli_num_rows($query1)>0)
			{     	
				while($fetch_product2=mysqli_fetch_assoc($query1))
				{
					$total_cgst=$total_cgst+$fetch_product2['cgst_amt'];
					$total_sgst=$total_sgst+$fetch_product2['sgst_amt'];
					$total_igst=$total_igst+$fetch_product2['igst_amt'];
					$total_final_net_amt=$total_final_net_amt+$fetch_product2['final_net_amt'];
					$temp_txn_id=$fetch_product2['transaction_id'];
					$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
					while($pro_fetch_return=mysqli_fetch_array($product_return)) 
					{ 
						$return_cgst_amt=$return_cgst_amt+$pro_fetch_return['return_cgst_amt'];
						$return_sgst_amt=$return_sgst_amt+$pro_fetch_return['return_sgst_amt'];
						$return_igst_amt=$return_igst_amt+$pro_fetch_return['return_igst_amt'];
						$return_net_amt=$return_net_amt+$pro_fetch_return['return_net_amt'];
					}
				}										
				$total_txn_amt=round($total_final_net_amt-$return_net_amt,2)-round($total_cgst-$return_cgst_amt,2)-round($total_sgst-$return_sgst_amt,2)-round($total_igst-$return_igst_amt,2);	
				if($client_gst_type=='GST') 				
					fputcsv($fp1, array($total_txn_amt,round($total_cgst-$return_cgst_amt,2),round($total_sgst-$return_sgst_amt,2),round($total_igst-$return_igst_amt,2),round($total_final_net_amt-$return_net_amt,2)));
				else
					fputcsv($fp1, array($total_txn_amt,round($total_cgst-$return_cgst_amt+$total_sgst-$return_sgst_amt+$total_igst-$return_igst_amt,2),round($total_final_net_amt-$return_net_amt,2)));
			}
			else
			{
				if($client_gst_type=='GST') 
					fputcsv($fp1, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				else
					fputcsv($fp1, array('Not Applicable','Not Applicable','Not Applicable'));
			}
			if($client_gst_type=='GST') 
				fputcsv($fp1, array('Total Taxable Sale Value','Central Tax','State Tax','Integrated Tax','Total Sale'));
			else
				fputcsv($fp1, array('Total Taxable Sale Value','VAT Tax','Total Sale'));
			$query11=mysqli_query($con,"SELECT hsn_code,SUM(total_sale) as total_sale,SUM(total_cgst_amt) as total_cgst_amt,SUM(total_sgst_amt) as total_sgst_amt,SUM(total_igst_amt) as total_igst_amt FROM  ".$extra_link3." where distributor_id='$ver' and transaction_date>='$start_date' and transaction_date<='$end_date' and bill_type in ('Tax Invoice','Payout','Both')");
			if(mysqli_num_rows($query11)>0)
			{
				while($fetch_product2=mysqli_fetch_assoc($query11))
				{
					if($ver==1018)
					{
						$query_tds=mysqli_query($con,"SELECT SUM(tds_amt) as total_tds,SUM(total_amount) as total_amount,SUM(disc_amt) as total_disc_amt  FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both')");
						while($fetch_tds=mysqli_fetch_assoc($query_tds))
						{
							$final_tds_amt=$fetch_tds['total_tds'];
							$final_total_amount=$fetch_tds['total_amount'];
							$final_disc_amt=$fetch_tds['total_disc_amt'];
						}
					}
					if($ver==1018)
					{ 
						fputcsv($fp1, array($final_total_amount-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$final_tds_amt-$fetch_product2['total_igst_amt']-$final_disc_amt,round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),$final_total_amount-$final_tds_amt-$final_disc_amt));	
					}
					else if($client_gst_type=='GST') 
					{
						fputcsv($fp1, array(round($fetch_product2['total_sale'],2)-round($fetch_product2['total_cgst_amt'],2)-round($fetch_product2['total_sgst_amt'],2)-round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_sale'],2)));
					}
					else
					{
						fputcsv($fp1, array(round($fetch_product2['total_sale'],2)-round($fetch_product2['total_cgst_amt'],2)-round($fetch_product2['total_sgst_amt'],2)-round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($fetch_product2['total_sale'],2)));
					}
				}	
			}
			else
			{
				if($client_gst_type=='GST') 
					fputcsv($fp1, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				else
					fputcsv($fp1, array('Not Applicable','Not Applicable','Not Applicable'));
			}
			fclose($fp1); 
			/*End GSTR1 3B Report    */
			/*B2C Report    */
			$fp2 = fopen($csv_filename3, 'w');
			if($client_gst_type=='GST')
				fputcsv($fp2, array('Receiver Name','Receiver GSTIN','No. of Invoices','Taxable Amount','Central Tax','State Tax','Integrated Tax','Total Invoice Value'));
			else
				fputcsv($fp2, array('Receiver Name','Receiver GSTIN','No. of Invoices','Taxable Amount','VAT Tax','Total Invoice Value'));
			
			$query11=mysqli_query($con,"SELECT transaction_to,party_name,gstin_no,SUM(total_sale) as total_sale,SUM(total_cgst_amt) as total_cgst_amt,SUM(total_sgst_amt) as total_sgst_amt,SUM(total_igst_amt) as total_igst_amt FROM  ".$extra_link3." where distributor_id='$ver' and transaction_date>='$start_date' and transaction_date<='$end_date' and gstin_no NOT IN ('','NA') and bill_type in ('Tax Invoice','Payout','Both') group by gstin_no");
			if(mysqli_num_rows($query11)>0)
			{
				while($fetch_product2=mysqli_fetch_assoc($query11))
				{
					$txn_to=$fetch_product2['transaction_to'];
					$txn_gstin=$fetch_product2['gstin_no'];
					$total_b2c_final=0;
					$final_tds_amt=0;
					$final_total_amount=0;
					$final_disc_amt=0;
					$invoices_no=mysqli_query($con,"SELECT count(".$extra_link1.".transaction_bill_number) as invoices_no FROM ".$extra_link1.",tbl_user,tbl_party WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_party.party_id=".$extra_link1.".transaction_to AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date' AND ".$extra_link1.".transaction_date<='$end_date' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin='$txn_gstin'");
						while($fetch_invoices_no=mysqli_fetch_array($invoices_no))
						{ 
							$inv_no=$fetch_invoices_no['invoices_no'];
						}
						if($ver=="1018")
						{
							$query_tds=mysqli_query($con,"SELECT SUM(tds_amt) as total_tds,SUM(total_amount) as total_amount,SUM(disc_amt) as total_disc_amt FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and  ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".transaction_to='$txn_to'");
							while($fetch_tds=mysqli_fetch_assoc($query_tds))
							{
								$final_tds_amt=$fetch_tds['total_tds'];
								$final_total_amount=$fetch_tds['total_amount'];
								$final_disc_amt=$fetch_tds['total_disc_amt'];
							}
							$total_b2c_final=$final_total_amount-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt']-$final_tds_amt-$final_disc_amt;
							$total_sale_final=$final_total_amount-$final_tds_amt-$final_disc_amt;
						}
						else
						{
							$total_b2c_final=$fetch_product2['total_sale']-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt']-round($fetch_product2['total_cess_amt'],2);
							$total_sale_final=round($fetch_product2['total_sale'],2);
						}
						if($client_gst_type=='GST')
							fputcsv($fp2, array($fetch_product2['party_name'],$fetch_product2['gstin_no'],$inv_no,round($total_b2c_final,2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),$total_sale_final));	
						else
							fputcsv($fp2, array($fetch_product2['party_name'],$fetch_product2['gstin_no'],$inv_no,round($total_b2c_final,2),round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),$total_sale_final));	
					}	
				}
				else
				{
					if($client_gst_type=='GST')
						fputcsv($fp2, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
					else
						fputcsv($fp2, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
				}
				fclose($fp2); 
				/*End B2C Report    */
				/*HSN-WISE Report    */
				$fp3 = fopen($csv_filename4, 'w');
				$start_date=$cyear."-".$cmonth."-01";
				$end_date=$cyear."-".$cmonth."-31";



				fputcsv($fp3, array('Sale'));
				if($client_gst_type=='GST')
					fputcsv($fp3, array('HSN Code','Total Quantity','Total Value','Total Taxable Value','Central Tax','State Tax','Integrated Tax','Cess'));
				else
					fputcsv($fp3, array('HSN Code','Total Quantity','Total Value','Total Taxable Value','VAT Tax','Cess'));
				$query11=mysqli_query($con,"SELECT tbl_product.hsn_code,SUM(".$extra_link2.".cess_final_amt) as total_cess_amt,SUM(".$extra_link2.".product_price * ".$extra_link2.".quantity) as total_amount,SUM(".$extra_link2.".product_disc) as total_disc_amt,SUM(".$extra_link2.".quantity) as total_qty,SUM(".$extra_link2.".CGST_amount) as total_cgst_amt,SUM(".$extra_link2.".SGST_amount) as total_sgst_amt, SUM(".$extra_link2.".IGST_amount) as total_igst_amt FROM ".$extra_link1.", tbl_user,".$extra_link2.",tbl_product where ".$extra_link1.".transaction_id=".$extra_link2.".transaction_id and ".$extra_link2.".product_id=tbl_product.product_id and ".$extra_link1.".transaction_from = tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') group by tbl_product.hsn_code");
					if(mysqli_num_rows($query11)>0)
					{
						while($fetch_product2=mysqli_fetch_assoc($query11))
						{
							if($client_gst_type=='GST')
							{
								fputcsv($fp3, array($fetch_product2['hsn_code'],$fetch_product2['total_qty'],round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt']+$fetch_product2['total_cess_amt']),round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt'])-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt'],round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2))); 
							}	
							else
							{
								fputcsv($fp3, array($fetch_product2['hsn_code'],$fetch_product2['total_qty'],round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt']+$fetch_product2['total_cess_amt']),round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt'])-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt'],round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2)));
							}
						}
					}
					else
					{
						if($client_gst_type=='GST')
							fputcsv($fp3, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
						else
							fputcsv($fp3, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
					}	
					fclose($fp3); 
					/*End HSN-WISE Report    */

					if(($cmonth=='06' || $cmonth=='09' || $cmonth=='12' || $cmonth=='03'))
					{
						$previous_month=$cmonth-2;
						if(strlen($previous_month)==1)
							$pre_month="0".$previous_month;
						else
							$pre_month=$previous_month;
						$start_date1=$cyear."-".$pre_month."-01";
						$end_date1=$cyear."-".$cmonth."-31";
						/*GSTR1 deatil Report    */	
						$fp9 = fopen($csv_filename14, 'w');
						fputcsv($fp9, array('Summary For B2B(4)'));
						fputcsv($fp9, array('No of Recipients','','No of Invoices','','Total Invoice Value','','','','','','','Total Taxable Value','Total Cess'));
						$final_total_gstin=0;
						$total_gstin_no=mysqli_query($con,"select ".$extra_link1.".transaction_id from ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date1' and ".$extra_link1.".transaction_date<='$end_date1' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin NOT IN ('','NA') group by ".$extra_link1.".party_gstin");
						$final_total_gstin= mysqli_num_rows($total_gstin_no);	

						$invoices_count=0;
						$total_invoice_value=0;
						$total_cess_value=0;
						$total_taxable_value=0;
						$total_bill=mysqli_query($con,"select * from ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date1' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin NOT IN ('','NA')");
						while($fetch_total_bill_data=mysqli_fetch_assoc($total_bill))
						{
							$invoices_count++;
							$total_cess_value=$total_cess_value+$fetch_total_bill_data['cess_amount'];
							$trans_id=$fetch_total_bill_data['transaction_id'];
							$dist_gst_configure=$fetch_total_bill_data['gst_configure'];
							$res_data = mysqli_query($con,"select *,".$extra_link2.".product_price as pprice from ".$extra_link2.",tbl_product where ".$extra_link2.".product_id=tbl_product.product_id and ".$extra_link2.".transaction_id='$trans_id'");
							while($fetch_product_bill_detail=mysqli_fetch_assoc($res_data))
							{
								if($ver=="1018")
								{ 
									$total_invoice_value=$total_invoice_value+($fetch_total_bill_data['total_amount']-$fetch_total_bill_data['disc_amt']-$fetch_total_bill_data['tds_amt']);
									$total_taxable_value=$total_taxable_value+($fetch_total_bill_data['total_amount']-$fetch_total_bill_data['disc_amt']-$fetch_total_bill_data['tds_amt']-$fetch_product_bill_detail['CGST_amount']-$fetch_product_bill_detail['SGST_amount']-$fetch_product_bill_detail['IGST_amount']);
								}
								else if($fetch_product_bill_detail['cess_calculation']=='Inclusive')
								{
									if($dist_gst_configure=="Inclusive") { 
										$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']));
										$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['CGST_amount']-$fetch_product_bill_detail['SGST_amount']-$fetch_product_bill_detail['IGST_amount']-$fetch_product_bill_detail['product_disc']-$fetch_product_bill_detail['cess_final_amt']),2);
									}
									else
									{
										$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']+$fetch_product_bill_detail['CGST_amount']+$fetch_product_bill_detail['SGST_amount']+$fetch_product_bill_detail['IGST_amount']));
										$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']-$fetch_product_bill_detail['cess_final_amt']),2);
									}
								}
								else
								{
									if($dist_gst_configure=="Inclusive") { 
										$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']+$fetch_product_bill_detail['cess_final_amt']));
										$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['CGST_amount']-$fetch_product_bill_detail['SGST_amount']-$fetch_product_bill_detail['IGST_amount']-$fetch_product_bill_detail['product_disc']),2);
									}
									else
									{
										$total_invoice_value=$total_invoice_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']+$fetch_product_bill_detail['CGST_amount']+$fetch_product_bill_detail['SGST_amount']+$fetch_product_bill_detail['IGST_amount']+$fetch_product_bill_detail['cess_final_amt']));
										$total_taxable_value=$total_taxable_value+round(($fetch_product_bill_detail['quantity']*$fetch_product_bill_detail['pprice']-$fetch_product_bill_detail['product_disc']),2);
									}
								}
							}
						}
						fputcsv($fp9, array($final_total_gstin,'',$invoices_count,'',round($total_invoice_value,2),'','','','','','',round($total_taxable_value,2),round($total_cess_value,2)));

						fputcsv($fp9, array('GSTIN/UIN of Recipient','Receiver Name','Invoice Number','Invoice Date','Invoice Value','Place Of Supply','Reverse Charge','Applicable % of Tax Rate','Invoice Type','E-Commerce GSTIN','Rate','Taxable Value','Cess Amount'));
						$query111=mysqli_query($con,"select * from ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date1' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin NOT IN ('','NA')");
						while($fetch_product2=mysqli_fetch_assoc($query111))
						{
							$bill_date=$fetch_product2['bill_date'];
							if ($fetch_product2['party_name']=="Bharti Hexacom Limited" || $fetch_product2['party_name']=="Airtel Payments Bank" || $fetch_product2['party_name']=="BHARTI TELEMEDIA LTD" || $fetch_product2['party_name']=="Bharti Airtel LTD" || $fetch_product2['party_name']=="AIRTEL PAYMENT BANK DELHI")
							{	
								$bill_no=$fetch_product2['txn_id'];
							}
							else
							{
								$bill_no=$fetch_product2['transaction_bill_number'];
							}
							$gstin_no=$fetch_product2['party_gstin'];
							$place_of_supply=$fetch_product2['place_of_supply'];
							$party_code=$fetch_product2['party_code'];
							$party_name=$fetch_product2['party_name'];
							$total_amount=$fetch_product2['total_amount'];
							$final_amt=$fetch_product2['final_amt'];
							$disc_amt=$fetch_product2['disc_amt'];
							$tds_amt=$fetch_product2['tds_amt'];
							$trans_id=$fetch_product2['transaction_id'];
							$dist_gst_configure=$fetch_product2['gst_configure'];
							$total_bill_tax_val=0;
							$total_bill_invoive_val=0;			
							$res1 = mysqli_query($con,"select *,".$extra_link2.".product_price as pprice from ".$extra_link2.",tbl_product where ".$extra_link2.".product_id=tbl_product.product_id and ".$extra_link2.".transaction_id='$trans_id'");
							while($fetch_product3=mysqli_fetch_assoc($res1))
							{
								if($ver=="1018")
								{ 
									$total_bill_invoive_val=$total_bill_invoive_val+($total_amount-$disc_amt-$tds_amt);
									$total_bill_tax_val=$total_bill_tax_val+($total_amount-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-$disc_amt-$tds_amt);
									fputcsv($fp9, array($gstin_no,$party_name,$bill_no,$bill_date,$total_amount-$disc_amt-$tds_amt,$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],$total_amount-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-$disc_amt-$tds_amt,round($fetch_product3['cess_final_amt'],2)));	
								}
								else if($fetch_product3['cess_calculation']=='Inclusive')
								{
									if($dist_gst_configure=="Inclusive") { 
										$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc'],2);
										$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc']-$fetch_product3['cess_final_amt'],2);
										fputcsv($fp9, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc'],2)-round($fetch_product3['cess_final_amt'],2),round($fetch_product3['cess_final_amt'],2)));	
									}
									else
									{
										$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2);
										$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc']-$fetch_product3['cess_final_amt'],2);
										fputcsv($fp9, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc'],2)-round($fetch_product3['cess_final_amt'],2),round($fetch_product3['cess_final_amt'],2)));
									}
								}
								else
								{
									if($dist_gst_configure=="Inclusive") { 
										$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt'],2);
										$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc'],2);
										fputcsv($fp9, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['CGST_amount'],2)-round($fetch_product3['SGST_amount'],2)-round($fetch_product3['IGST_amount'],2)-round($fetch_product3['product_disc'],2),round($fetch_product3['cess_final_amt'],2)));	
									}
									else
									{
										$total_bill_invoive_val=$total_bill_invoive_val+round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2);
										$total_bill_tax_val=$total_bill_tax_val+round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc'],2);
										fputcsv($fp9, array($gstin_no,$party_name,$bill_no,date("d-M-Y", strtotime($bill_date)),round(($fetch_product3['quantity']*$fetch_product3['pprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],2),$party_code.'-'.$place_of_supply,'N','','Regular B2B','',$fetch_product3['CGST']+$fetch_product3['SGST'],round($fetch_product3['quantity']*$fetch_product3['pprice'],2)-round($fetch_product3['product_disc'],2),round($fetch_product3['cess_final_amt'],2)));
									}
								}
							}	
							fputcsv($fp9, array('Total','-','-','-',$total_bill_invoive_val,'-','-','-','-','-','-',$total_bill_tax_val,'-'));
						}

						fclose($fp9); 
						/* End GSTR1 deatil Report    */	



						/*Document deatil Report    */	
						$fp10 = fopen($csv_filename13, 'w');
						fputcsv($fp10, array('#','Code','Receiver Name','Invoice No.','Invoice Date','Quantity','Rate(%)','Amount','Type'));
						$res = "select * from tbl_bill_cancel,tbl_party,tbl_user where tbl_bill_cancel.transaction_to=tbl_party.party_id and tbl_bill_cancel.transaction_from=tbl_user.user_id and tbl_bill_cancel.transaction_date>='$start_date1' and tbl_bill_cancel.transaction_date<='$end_date1' and tbl_user.distributor_id='$ver' and tbl_bill_cancel.bill_type in ('Tax Invoice','Payout','Both')";
						$query1=mysqli_query($con,$res); 
						if(mysqli_num_rows($query1)>0)
						{
							$c=1; 
							while($fetch_product2=mysqli_fetch_assoc($query1))
							{
								$bill_date=$fetch_product2['transaction_date'];
								$bill_no=$fetch_product2['transaction_bill_number'];
								$sale_type=$fetch_product2['payment_mode'];
								$party_name=$fetch_product2['party_name'];
								$party_phone=$fetch_product2['party_phone'];
								$mc_name=$fetch_product2['user_phone'];
								$trans_id=$fetch_product2['transaction_id'];
								$dist_gst_configure=$fetch_product2['gst_configure'];
								$res1 = mysqli_query($con,"select *,tbl_bill_cancel_detail.product_price as saleprice from tbl_bill_cancel_detail,tbl_product where tbl_bill_cancel_detail.product_id=tbl_product.product_id and tbl_bill_cancel_detail.transaction_id='$trans_id'");
								while($fetch_product3=mysqli_fetch_array($res1))
								{
									$p_nm=$party_name." - ".$party_phone;
									if($dist_gst_configure=="Inclusive")
										$txn_rate=$fetch_product3['saleprice']/((100+$fetch_product3['CGST']+$fetch_product3['SGST'])/100);
									else 
										$txn_rate= $fetch_product3['saleprice'];
									if($ver==1018)
									{
										$net=$fetch_product2['total_amount']-$fetch_product2['tds_amt']-$fetch_product3['product_disc'];	
									}
									else if($fetch_product3['cess_calculation']=='Inclusive')
									{
										if($dist_gst_configure=="Inclusive")
											$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])-$fetch_product3['product_disc'],4);
										else
											$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])-$fetch_product3['product_disc']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],4);
									}
									else
									{ 
										if($dist_gst_configure=="Inclusive")
											$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])+$fetch_product3['cess_final_amt']-$fetch_product3['product_disc'],4);
										else
											$net=round(($fetch_product3['quantity']*$fetch_product3['saleprice'])-$fetch_product3['product_disc']+$fetch_product3['cess_final_amt']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount'],4);
									}
									if($sale_type=="Cheque"){ $sale_type="Credit"; }
									fputcsv($fp10, array($c,$mc_name,$p_nm,$bill_no,$bill_date,$fetch_product3['product_name'],$fetch_product3['quantity'],round($txn_rate,5),$net,$sale_type));
									$c++;		
								} 

							}
						}
						else
						{
							fputcsv($fp10, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
						}

						fclose($fp10); 
						/* End Document deatil Report    */	





						/*Document Report   */	
						$fp11 = fopen($csv_filename12, 'w');
						fputcsv($fp11, array('Month','Sr.No. - From','Sr.No. - To','Total Number','Cancelled'));

						$next_month='';
						$start_date2=$start_date1;
						$end_date2=date("Y-m-t", strtotime($start_date1));
						for($i=1;$i<=3;$i++)
						{
							$start_detail=$end_detail='';
							$bill_start=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from = tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date2' AND ".$extra_link1.".transaction_date<='$end_date2' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Self' ORDER BY ".$extra_link1.".transaction_bill_number ASC LIMIT 0,1");
							if(mysqli_num_rows($bill_start)>0)
							{
								$fetch_start_data=mysqli_fetch_assoc($bill_start);
								$start_detail=$fetch_start_data['transaction_bill_number'];
							}
							$bill_start1=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from = tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date2' AND ".$extra_link1.".transaction_date<='$end_date2' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Auto' ORDER BY ".$extra_link1.".transaction_bill_number ASC LIMIT 0,1");
							if(mysqli_num_rows($bill_start1)>0)
							{
								$fetch_start_data1=mysqli_fetch_assoc($bill_start1);
								$start_detail=$start_detail.' - '.$fetch_start_data1['transaction_bill_number'];
							}
							$bill_end=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from = tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date2' AND ".$extra_link1.".transaction_date<='$end_date2' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Self' ORDER BY ".$extra_link1.".transaction_bill_number DESC LIMIT 0,1");
							if(mysqli_num_rows($bill_end)>0)
							{
								$fetch_end_data=mysqli_fetch_assoc($bill_end);
								$end_detail=$fetch_end_data['transaction_bill_number'];	
							}	
							$bill_end1=mysqli_query($con,"SELECT transaction_bill_number FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from = tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date2' AND ".$extra_link1.".transaction_date<='$end_date2' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by='' and ".$extra_link1.".bill_mode='Auto' ORDER BY ".$extra_link1.".transaction_bill_number DESC LIMIT 0,1");
							if(mysqli_num_rows($bill_end1)>0)
							{
								$fetch_end_data1=mysqli_fetch_assoc($bill_end1);
								$end_detail=$end_detail.' - '.$fetch_end_data1['transaction_bill_number'];	
							}

							$total_bill=mysqli_query($con,"SELECT count(transaction_id) as invoices_count FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date2' AND ".$extra_link1.".transaction_date<='$end_date2' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both')");
							$fetch_total_bill_data=mysqli_fetch_assoc($total_bill);

							$bill_cancel=mysqli_query($con,"SELECT count(transaction_id) as invoices_count FROM tbl_bill_cancel,tbl_user WHERE tbl_bill_cancel.transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND tbl_bill_cancel.transaction_date>='$start_date2' AND tbl_bill_cancel.transaction_date<='$end_date2' and tbl_bill_cancel.bill_type in ('Tax Invoice','Payout','Both')");
							$fetch_cancel_data=mysqli_fetch_assoc($bill_cancel);
							$cancel_count=$fetch_cancel_data['invoices_count'];

							fputcsv($fp11, array(date('F', strtotime($start_date2)),$start_detail,$end_detail,$fetch_total_bill_data['invoices_count']+$cancel_count,$cancel_count));
							if($start_date>=$check_datetable)
							{
								$bill_start1=mysqli_query($con,"SELECT ".$extra_link1.".txn_id FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date2' AND ".$extra_link1.".transaction_date<='$end_date2' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by!='' ORDER BY ".$extra_link1.".id ASC");
							}else{
								$bill_start1=mysqli_query($con,"SELECT ".$extra_link1.".txn_id FROM ".$extra_link1.",tbl_user WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date2' AND ".$extra_link1.".transaction_date<='$end_date2' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".generated_by!='' ORDER BY ".$extra_link1.".transaction_id ASC");
							}
							while($fetch_start_data1=mysqli_fetch_assoc($bill_start1)) {
								fputcsv($fp11, array(date('F', strtotime($start_date2)),$fetch_start_data1['txn_id'],'','1',''));	
							}	
							if($next_month=='')
								$next_month=$previous_month+1;
							else
								$next_month=$next_month+1;
							if(strlen($next_month)==1)
								$next_month="0".$next_month;
							$start_date2=$cyear."-".$next_month."-01";
							$end_date2=date("Y-m-t", strtotime($start_date2));
						}

						fclose($fp11); 
						/* End Document Report    */	

						/*HSN-WISE Report    */
						$fp12 = fopen($csv_filename11, 'w');

						fputcsv($fp12, array('Sale'));
						if($client_gst_type=='GST')
							fputcsv($fp12, array('HSN Code','Total Quantity','Total Value','Total Taxable Value','Central Tax','State Tax','Integrated Tax','Cess'));
						else
							fputcsv($fp12, array('HSN Code','Total Quantity','Total Value','Total Taxable Value','VAT Tax','Cess'));
						$query11=mysqli_query($con,"SELECT tbl_product.hsn_code,SUM(".$extra_link2.".cess_final_amt) as total_cess_amt,SUM(".$extra_link2.".product_price * ".$extra_link2.".quantity) as total_amount,SUM(".$extra_link2.".product_disc) as total_disc_amt,SUM(".$extra_link2.".quantity) as total_qty,SUM(".$extra_link2.".CGST_amount) as total_cgst_amt,SUM(".$extra_link2.".SGST_amount) as total_sgst_amt, SUM(".$extra_link2.".IGST_amount) as total_igst_amt FROM ".$extra_link1.", tbl_user,".$extra_link2.",tbl_product where ".$extra_link1.".transaction_id=".$extra_link2.".transaction_id and ".$extra_link2.".product_id=tbl_product.product_id and ".$extra_link1.".transaction_from = tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') group by tbl_product.hsn_code");
							if(mysqli_num_rows($query11)>0)
							{
								while($fetch_product2=mysqli_fetch_assoc($query11))
								{
									if($client_gst_type=='GST')
									{
										fputcsv($fp12, array($fetch_product2['hsn_code'],$fetch_product2['total_qty'],round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt']+$fetch_product2['total_cess_amt']),round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt'])-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt'],round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2))); 
									}	
									else
									{
										fputcsv($fp12, array($fetch_product2['hsn_code'],$fetch_product2['total_qty'],round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt']+$fetch_product2['total_cess_amt']),round($fetch_product2['total_amount']-$fetch_product2['total_disc_amt'])-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt'],round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2))); 
									}
								}
							}
							else
							{
								if($client_gst_type=='GST')
									fputcsv($fp12, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
								else
									fputcsv($fp12, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
							}	
							fclose($fp12); 
							/*End HSN-WISE Report    */


							/*B2C Report    */	
							$fp13 = fopen($csv_filename9, 'w');
							if($ver=="1018")
								fputcsv($fp13, array('Taxable Value','Central Tax','State Tax','Integrated Tax','Cess','Total Sale'));
							else if($client_gst_type=='GST')
								fputcsv($fp13, array('Taxable Value','Rate','Central Tax','State Tax','Integrated Tax','Cess','Total Sale'));
							else
								fputcsv($fp13, array('Taxable Value','Rate','VAT Tax','Cess','Total Sale'));
							$final_flag=0;

							if($ver=="1018")
							{
								$final_tds_amt=0;
								$final_cess_amt=0;
								$final_total_amount=0;
								$final_disc_amt=0;
								$query11=mysqli_query($con,"SELECT SUM(total_sale) as total_sale,SUM(total_cgst_amt) as total_cgst_amt,SUM(total_sgst_amt) as total_sgst_amt,SUM(total_igst_amt) as total_igst_amt,SUM(total_cess_amt) as total_cess_amt FROM  ".$extra_link3." where distributor_id='$ver' and transaction_date>='$start_date' and transaction_date<='$end_date' and gstin_no in ('','NA') and bill_type in ('Tax Invoice','Payout','Both')");
								if(mysqli_num_rows($query11)>0)
								{
									$final_flag=1;
									while($fetch_product2=mysqli_fetch_assoc($query11))
									{
										$final_cess_amt=$fetch_product2['total_cess_amt'];
										$query_tds=mysqli_query($con,"SELECT SUM(tds_amt) as total_tds,SUM(total_amount) as total_amount,SUM(disc_amt) as total_disc_amt FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and tbl_party.gstin_no in ('','NA')");
										while($fetch_tds=mysqli_fetch_assoc($query_tds))
										{
											$final_tds_amt=$fetch_tds['total_tds'];
											$final_total_amount=$fetch_tds['total_amount'];
											$final_disc_amt=$fetch_tds['total_disc_amt'];
										}
										$total_b2c_final= $final_total_amount-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt']-$final_tds_amt-$final_disc_amt;
										$total_sale_final=$final_total_amount-$final_tds_amt-$final_disc_amt;
										fputcsv($fp13, array($total_b2c_final,round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($final_cess_amt,2),$total_sale_final));	
									}
								}
							}	
							else
							{	
								$query11=mysqli_query($con,"select sum(round(product_price*quantity,1)) as total_sale,sum(CGST_amount) as total_cgst_amt,SUM(SGST_amount) as total_sgst_amt,SUM(IGST_amount) as total_igst_amt,SUM(cess_final_amt) as total_cess_amt,gst_perc,sum(product_disc) as prodisc  from ".$extra_link2." WHERE transaction_id in (SELECT transaction_id FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date' and ".$extra_link1.".transaction_date<='$end_date' and tbl_user.distributor_id='$ver' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin in ('','NA')) group by ".$extra_link2.".gst_perc");	
								if(mysqli_num_rows($query11)>0)
								{ 
									$final_flag=1;
									while($fetch_product2=mysqli_fetch_assoc($query11))
									{		
										$total_b2c_final= round($fetch_product2['total_sale'],2)-round($fetch_product2['total_cgst_amt'],2)-round($fetch_product2['total_sgst_amt'],2)-round($fetch_product2['total_igst_amt'],2)-round($fetch_product2['total_cess_amt'],2)-round($fetch_product2['prodisc'],2); 
										$total_sale_final=round($fetch_product2['total_sale']-$fetch_product2['prodisc'],2);
										if($client_gst_type=='GST')
											fputcsv($fp13, array($total_b2c_final,round($fetch_product2['gst_perc'],2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($final_cess_amt,2),$total_sale_final));	
										else
											fputcsv($fp13, array($total_b2c_final,round($fetch_product2['gst_perc'],2),round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($final_cess_amt,2),$total_sale_final));

									}	
								}
							}
							if($final_flag==0)
							{
								if($ver=="1018")
									fputcsv($fp13, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
								else if($client_gst_type=='GST')
									fputcsv($fp13, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
								else
									fputcsv($fp13, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
							}
							fclose($fp13); 
							/* End B2C Report    */	

							/*B2B Report    */
							$fp14 = fopen($csv_filename10, 'w');
							if($client_gst_type=='GST')
								fputcsv($fp14, array('Receiver Name','Receiver GSTIN','No. of Invoices','Taxable Amount','Central Tax','State Tax','Integrated Tax','Cess','Total Invoice Value'));
							else
								fputcsv($fp14, array('Receiver Name','Receiver GSTIN','No. of Invoices','Taxable Amount','VAT Tax','Cess','Total Invoice Value'));
							$query11=mysqli_query($con,"SELECT transaction_to,party_name,gstin_no,SUM(total_sale) as total_sale,SUM(total_cgst_amt) as total_cgst_amt,SUM(total_sgst_amt) as total_sgst_amt,SUM(total_igst_amt) as total_igst_amt FROM  ".$extra_link3." where distributor_id='$ver' and transaction_date>='$start_date1' and transaction_date<='$end_date1' and gstin_no NOT IN ('','NA') and bill_type in ('Tax Invoice','Payout','Both') group by gstin_no");
							if(mysqli_num_rows($query11)>0)
							{
								while($fetch_product2=mysqli_fetch_assoc($query11))
								{
									$txn_to=$fetch_product2['transaction_to'];
									$txn_gstin=$fetch_product2['gstin_no'];
									$total_b2c_final=0;
									$final_tds_amt=0;
									$final_total_amount=0;
									$final_disc_amt=0;
									$invoices_no=mysqli_query($con,"SELECT count(".$extra_link1.".transaction_bill_number) as invoices_no FROM ".$extra_link1.",tbl_user,tbl_party WHERE ".$extra_link1.".transaction_from=tbl_user.user_id AND tbl_party.party_id=".$extra_link1.".transaction_to AND tbl_user.distributor_id='$ver' AND ".$extra_link1.".transaction_date>='$start_date1' AND ".$extra_link1.".transaction_date<='$end_date1' and ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".party_gstin='$txn_gstin'");

										while($fetch_invoices_no=mysqli_fetch_array($invoices_no))
										{ 
											$inv_no=$fetch_invoices_no['invoices_no'];
										}
										if($ver==1018)
										{
											$query_tds=mysqli_query($con,"SELECT SUM(tds_amt) as total_tds,SUM(total_amount) as total_amount,SUM(disc_amt) as total_disc_amt FROM ".$extra_link1.",tbl_party,tbl_user where ".$extra_link1.".transaction_to=tbl_party.party_id and ".$extra_link1.".transaction_from=tbl_user.user_id and ".$extra_link1.".transaction_date>='$start_date1' and ".$extra_link1.".transaction_date<='$end_date1' and tbl_user.distributor_id='$ver' and  ".$extra_link1.".bill_type in ('Tax Invoice','Payout','Both') and ".$extra_link1.".transaction_to='$txn_to'");
											while($fetch_tds=mysqli_fetch_assoc($query_tds))
											{
												$final_tds_amt=$fetch_tds['total_tds'];
												$final_total_amount=$fetch_tds['total_amount'];
												$final_disc_amt=$fetch_tds['total_disc_amt'];
											}
											$total_b2c_final=$final_total_amount-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt']-$final_tds_amt-$final_disc_amt;
											$total_sale_final=$final_total_amount-$final_tds_amt-$final_disc_amt;
										}
										else
										{
											$total_b2c_final=$fetch_product2['total_sale']-$fetch_product2['total_cgst_amt']-$fetch_product2['total_sgst_amt']-$fetch_product2['total_igst_amt']-round($fetch_product2['total_cess_amt'],2);
											$total_sale_final=round($fetch_product2['total_sale'],2);
										}
										if($client_gst_type=='GST')
											fputcsv($fp14, array($fetch_product2['party_name'],$fetch_product2['gstin_no'],$inv_no,round($total_b2c_final,2),round($fetch_product2['total_cgst_amt'],2),round($fetch_product2['total_sgst_amt'],2),round($fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2),$total_sale_final));	
										else
											fputcsv($fp14, array($fetch_product2['party_name'],$fetch_product2['gstin_no'],$inv_no,round($total_b2c_final,2),round($fetch_product2['total_cgst_amt']+$fetch_product2['total_sgst_amt']+$fetch_product2['total_igst_amt'],2),round($fetch_product2['total_cess_amt'],2),$total_sale_final));
									}	
								}
								else
								{
									if($client_gst_type=='GST')
										fputcsv($fp14, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
									else
										fputcsv($fp14, array('Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable','Not Applicable'));
								}
								fclose($fp14); 
								/*End B2B Report    */

							}

						}

						if($flag_done==1)
						{
							$search_month=date("F", strtotime($start_date));
							$user_mail_body="<tr><td style='padding:20px'>
							<table style='max-width:730px' align='center' bgcolor='#ffffff' border='0' cellpadding='0' cellspacing='0' width='100%'>
							<tbody>
							<tr>
							<td style='font-size:1px;line-height:1px;height:1px' colspan='3' bgcolor='#d6d6d6' height='1'>  </td>
							</tr>
							<tr>
							<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
							<td><table align='center' border='0' cellpadding='0' cellspacing='0' width='100%'>
							<tbody>
							<tr>
							<td colspan='4' height='20'>&nbsp;</td>
							</tr>
							<tr>
							<td width='24'>&nbsp;</td>
							<td width='293'>&nbsp;</td>
							<td width='155'><a style='text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#6ac451'><img class='CToWUd' src='http://bthawk.com/img/header/BTHAWK.png' alt='BTHAWK'></a></td>
							<td width='26'>&nbsp;</td>
							</tr>
							<tr>
							<td colspan='4' height='17'>&nbsp;</td>
							</tr>
							<tr>
							<td style='min-height:1px;line-height:0px;font-size:0px' colspan='4' bgcolor='#d6d6d6' height='1'>  </td>
							</tr>
							<tr>
							<td colspan='4' height='10'>&nbsp;</td>
							</tr>
							<tr>
							<td width='24'>&nbsp;</td>
							<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666' colspan='2'>
							<p>Dear $dis_name</p>
							</td>
							<td width='26'>&nbsp;</td>
							</tr>
							<tr>
							<td colspan='4' height='0'>&nbsp;</td>
							</tr>
							<tr>
							<td width='24'>&nbsp;</td>
							<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>
							Your '$search_month' GSTR report has been generated. Kindly find the attachment of GSTR3B,HSNWISE,B2B AND B2C Reports. 

							<br><br><b>NOTE:</b><br>
							<i class='fa fa-hand-o-right'></i> Kindly refer Total Taxable Sale Value, (State Tax, Central Tax and Integrated Tax) of sale to put on <b>3.1 tax on outward and reverse charge inward supplies</b><br>

							<i class='fa fa-hand-o-right'></i> Kindly refer (State Tax, Central Tax and Integrated Tax) of Purchase to put on <b>4. Eligible ITC </b><br>

							<i class='fa fa-hand-o-right'></i> Please validate your data before filing of GST<br>
							<br>Please take help from <b>youtube video <a href='https://youtu.be/N-0owzye0y0' target='_blank'>https://youtu.be/N-0owzye0y0</a></b>
							</td>
							<td>&nbsp;</td>
							</tr>
							<tr>
							<td colspan='4' height='5'>&nbsp;</td>
							</tr>


							<tr>
							<td colspan='4' height='15'>&nbsp;</td>
							</tr>
							<tr>
							<td width='24'>&nbsp;</td>
							<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#000;line-height:24px' colspan='2'>Best Regards,</td>
							<td>&nbsp;</td>
							</tr>
							<tr>
							<td width='24'>&nbsp;</td>
							<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;line-height:24px' colspan='2'>BTHAWK Support</td>
							<td>&nbsp;</td>
							</tr>
							<tr>
							<td width='24'>&nbsp;</td>
							<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;line-height:24px' colspan='2'>+91-7340040171</td>
							<td>&nbsp;</td>
							</tr>
							<tr>
							<td colspan='4' height='10'>&nbsp;</td>
							</tr>
							<tr>
							<td style='line-height:1px' colspan='4' bgcolor='#d6d6d6' height='1'>  </td>
							</tr>
							<tr>
							<td colspan='4' bgcolor='#f3f3f3' height='10'>&nbsp;</td>
							</tr>
							<tr>
							<td colspan='4' bgcolor='#f3f3f3'>
							<table border='0' cellpadding='0' cellspacing='0'>
							<tbody>
							<tr>
							<td width='15'>&nbsp;</td>
							<td style='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:20px' colspan='2'>If you have any issues, feel free to contact us at <a style='text-decoration:none;color:#ea8a00' href='mailto:http://www.belltechnology.in/' target='_blank'>http://www.belltechnology.in/</a></td>
							<td width='12'>&nbsp;</td>
							</tr>
							</tbody>
							</table>
							</td>
							</tr>
							<tr>
							<td colspan='4' bgcolor='#f3f3f3' height='10'>&nbsp;</td>
							</tr>
							</tbody>
							</table>
							</td>
							<td bgcolor='#d6d6d6' width='1'>&nbsp;</td>
							</tr>
							<tr>
							<td style='line-height:1px' colspan='3' bgcolor='#d6d6d6' height='1'>  </td>
							</tr>
							</tbody>
							</table>
							</td>
							</tr><br><br><hr>Disclaimer:This E-Mail may contain Confidential and/or legally privileged Information and is meant for the intended recipient(s) only. If you have received this e-mail in error and are not the intended recipient/s, Kindly notify the sender and then delete this e-mail immediately from your system. You are also hereby notified that any use, any form of reproduction, dissemination, copying, disclosure, modification, distribution and/or publication of this e-mail, its contents or its attachment/s other than by its intended recipient/s is strictly prohibited and may be unlawful.

							Internet Communications cannot be guaranteed to be secure or error-free as information could be delayed, intercepted, corrupted, lost, or contain viruses. BTHAWK does not accept any liability for any errors, omissions, viruses or computer problems experienced by any recipient as a result of this e-mail.";



							$mail = new PHPMailer(true);
							$mail->isSMTP();
							$mail->Host = "server1.appexperts.net";
							$mail->Port = 587;
							$mail->SMTPSecure = "tls";
							$mail->SMTPAuth = true;
							$mail->Username = "bthawk@appexperts.net";
							$mail->Password = "aTTG7LcWg@7U";
							$mail->SetFrom("bthawk@appexperts.net");
							$mail->addAddress('vijay.sharma@bthawk.com'); 
							$mail->addCC("padam.yadav@bthawk.com","Padam Sir");
							$mail->addAttachment($csv_filename1); 
							$mail->addAttachment($csv_filename2);
							$mail->addAttachment($csv_filename3); 
							$mail->addAttachment($csv_filename4);
							$mail->addAttachment($csv_filename5);
							$mail->addAttachment($csv_filename6);
							$mail->addAttachment($csv_filename7);
							$mail->addAttachment($csv_filename8);
							$mail->IsHTML(true);
							// $mail->Subject = "DSC is Approved";
							// $mail->Body = $user_mail_body;
							$mail->SMTPOptions = array('ssl' => array(
								'verify_peer' => false,
								'verify_peer_name' => false,
								'allow_self_signed' => false
							));

							if(($cmonth=='06' || $cmonth=='09' || $cmonth=='12' || $cmonth=='03'))
							{
								$mail->addAttachment($csv_filename9); 
								$mail->addAttachment($csv_filename10);
								$mail->addAttachment($csv_filename11); 
								$mail->addAttachment($csv_filename12);
								$mail->addAttachment($csv_filename13);
								$mail->addAttachment($csv_filename14);
								$mail->addAttachment($csv_filename15);
							}

			//To address and name
							$mail->addAddress($dis_email);
							$mail->isHTML(true);
							$mail->Subject = "GSTR Reports for ".$search_month;
							$mail->Body = "<i>$user_mail_body</i>";
							if($mail->send()) 
							{   
								unlink($csv_filename1);
								unlink($csv_filename2);
								unlink($csv_filename3);
								unlink($csv_filename4);
								unlink($csv_filename5);
								unlink($csv_filename6);
								unlink($csv_filename7);
								unlink($csv_filename8);
								if(($cmonth=='06' || $cmonth=='09' || $cmonth=='12' || $cmonth=='03'))
								{
									unlink($csv_filename9);
									unlink($csv_filename10);
									unlink($csv_filename11);
									unlink($csv_filename12);
									unlink($csv_filename13);
									unlink($csv_filename14);
									unlink($csv_filename15);
								}
								$response['success']='1';
								$response['details']="GSTR Report generated successfully and sent on your registered e-Mail-".$dis_email."!!          आपकी GST रिपोर्ट  तैयार हो गयी है और आपकी रजिस्टर्ड ईमेल Id - पर भेज दी गयी है ।";
							} 
							else 
							{
								$response['success']='1';
								$response['details']="Mail Not Send";
							}
						}
					}
					else
					{
						$response['success']='0';
						$response['details']="Your GSTR Report already send to your registered email-id 3 times. Please check your mail, else contact BTHAWK Team.";
					}
				}
				else
				{
					$response['success']='0';
					$response['details']="Required field missing";
				}	
				echo json_encode($response);
			?>
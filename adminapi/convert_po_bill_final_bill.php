<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['total_order']) && isset($_POST['key_pid']) && isset($_POST['payment_mode']) && isset($_POST['payment_status']) && isset($_POST['distributor_id']) && isset($_POST['final_amt']) && isset($_POST['invoice_type']) &&isset($_POST['cess_amount']))
{  
	$bodydata = print_r($_POST, true);
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$query_log=mysqli_query($con,"insert into tbl_sale_log_data(`distributor_id`,`transaction_date`,`log_data`,`source`)values('$dis_id','$da','$bodydata','Admin')");
	$bank_name="";
	$cheque_no="";
	$cheque_date="";
	$client1 = $_POST['key_uid'];
	$amount = $_POST['amount'];  
	$final_amt = $_POST['final_amt']; 
	$cess_amt = $_POST['cess_amount'];
	$round_off_amt = $_POST['round_off_amt']; 	
	$toder = $_POST['total_order'];
	$disc_amt = 0;  
	
	if (strpos($toder, 'pid') !== false) {
		$productdetailexists = "Yes";
	} else {
		$productdetailexists = "No";
	}
	
	if($toder=='[]' || $productdetailexists=='No')
	{
		$response['success']=0;
		$response['details']="Item Detail Missing. Please try again later!!";
	}
	else
	{
		$p_client = $_POST['key_pid']; 
		$disc_bill_amt=isset($_POST['bill_discount_amt']) ? $_POST['bill_discount_amt'] : '0';
		$gstconfig=isset($_POST['gstconfig']) ? $_POST['gstconfig'] : '';
		$photoname='';
		
		$labouramt=isset($_POST['labouramt']) ? $_POST['labouramt'] : '0';
		$freightamt=isset($_POST['freightamt']) ? $_POST['freightamt'] : '0';
		$otherexpamt=isset($_POST['otherexpamt']) ? $_POST['otherexpamt'] : '0';
		$party_gstin = isset($_POST['party_gstin']) ? $_POST['party_gstin'] : '';
		
		$check_product_type = isset($_POST['invoice_product_type']) ? $_POST['invoice_product_type'] : '';
		$pmode = $_POST['payment_mode'];
		$serial_bill = 'No';
		$latitude = isset($_POST['latitude']) ? $_POST['latitude'] : '';
		$longitude = isset($_POST['longitude']) ? $_POST['longitude'] : '';
		$pstatus = $_POST['payment_status'];
		$tds_amt = isset($_POST['tds_amt']) ? $_POST['tds_amt'] : '';
		$bank_name = isset($_POST['bank_name']) ? $_POST['bank_name'] : '';
		$cheque_no = isset($_POST['cheque_no']) ? $_POST['cheque_no'] : '';
		$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
		$remark=$_POST['remark'];
		$invoice_type1=$_POST['invoice_type'];
		
		$courier_facility =  'No';
		$courier_no = $reference_no =  $courier_date =  $courier_company =  $brokerno =  $message_txn_id =  $consignee_name =  $g_r_no = $transport_date =  $transport_address =  $transport_company =  '';
		
		$tcs_perc = isset($_POST['tcs_perc']) ? $_POST['tcs_perc'] : '0';
		$tcs_applicable = isset($_POST['tcs_applicable']) ? $_POST['tcs_applicable'] : 'No';
		$tcs_Amt = isset($_POST['tcs_Amt']) ? $_POST['tcs_Amt'] : '0';
		if($tcs_applicable=='No')
			$tcs_Amt=0;
		
		$perdoc_no=$_POST['per_doc_no'];
		$deposit_bank_id = isset($_POST['bnk_id']) ? $_POST['bnk_id'] : '0';
		
		$check_author = mysqli_query($con,"select dsr_requirement from tbl_distributor where distributor_id='$dis_id'");
		while($row_data = mysqli_fetch_array($check_author))
		{
			$dist_dsr_require=$row_data['dsr_requirement'];
		}
		if($pmode=="Both")
		{
			$cash_amt=$_POST['cash_amount'];
			$cheque_amt=$_POST['cheque_amount'];
		}
		else if($pmode=="Cash")
		{
			$cash_amt=$final_amt;
			$cheque_amt=0;
		}
		else
		{
			$cash_amt=0;
			$cheque_amt=$final_amt;
		}
		
		$scri =$da." ".$scro;
		$temp_date2=strtotime($da);

		include("../client_bill_sequence.php");
		$SendSequence=new SendSequence();
		$sd=$SendSequence->fetch_sequence($dis_id,$invoice_type1,$con);
		if($sd!='')
		{
			$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
			$query ="insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number, transaction_from,transaction_to, total_amount, payment_mode,payment_status,bank_name,cheque_no,cash_amount,cheque_amount,remark,cheque_date,disc_amt,final_amt,bill_type,cess_amount,round_off_amt,serial_no_bill,bill_date,latitude,longitude,courier_facility,courier_no,reference_no,courier_date,courier_company,message_txn_id,consignee_name,transport_company,g_r_no,transport_date,transport_address,tds_amt,party_gstin,labour_charges,freight_charges,other_expenses,generated_by,sign_image,gst_configure,source,discount_on_total,broker_no,is_tcs,tcs_amount,final_amt_w_tcs,tcs_percentage,dsr_requirement_val,bank_id,payment_type,performa_convert_id,performa_invoice)values('$transaction_id','$da','$scro','$sd','$client1','$p_client','$amount','$pmode','$pstatus','$bank_name','$cheque_no','$cash_amt','$cheque_amt','$remark','$cheque_date','$disc_amt','$final_amt','$invoice_type1','$cess_amt','$round_off_amt','$serial_bill','$da','$latitude','$longitude','$courier_facility','$courier_no','$reference_no','$courier_date','$courier_company','$message_txn_id','$consignee_name','$transport_company','$g_r_no','$transport_date','$transport_address','$tds_amt','$party_gstin','$labouramt','$freightamt','$otherexpamt','','$photoname','$gstconfig','Admin','$disc_bill_amt','$brokerno','$tcs_applicable','$tcs_Amt','$final_amt','$tcs_perc','$dist_dsr_require','$deposit_bank_id','$payment_type','$perdoc_no','Yes')";
			$res = mysqli_query($con,$query);	
			if($res)
			{
				$bill_invoice_id = $transaction_id;
				$json_a=json_decode($toder, true);     
				foreach ($json_a as $person_a)
				{
					$prodid=$person_a['pid'];
					$prodname=$person_a['pname'];
					$ordquantiy=$person_a['quantity'];
					$proprice=$person_a['pro_price'];
					$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
					$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
					$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
					$cess_percentage = isset($person_a['cess_percentage']) ? $person_a['cess_percentage'] : '';
					$cess_final_amt = isset($person_a['cess_final_amt']) ? $person_a['cess_final_amt'] : '';
					$pro_gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
					$pur_total_amt = isset($person_a['pur_total_amt']) ? $person_a['pur_total_amt'] : '0';
					$pur_taxable_amt = isset($person_a['pur_taxable_amt']) ? $person_a['pur_taxable_amt'] : '0';
					$sale_unit = isset($person_a['sale_unit']) ? $person_a['sale_unit'] : '';
					$pur_maintain_inventory = $person_a['maintain_inventory'];
					
					$dis_type = $dis_per =  $pro_imei_no = $d_type = '';
					$cess_per_amt =  $pro_discount = $pro_actual_qty = $probagtype = $probagqty = 0;
					$consume_flag = 'No';
						
					$query2=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity,CGST_amount,SGST_amount,product_price,discount_type,discount_percentage,cess_pc_amt,cess_percentage,cess_final_amt,product_disc,IMEI_NO,IGST_amount,actual_quantity,gst_perc,product_total_amt,taxable_amount,bag_type,bag_qty,consume_detail,dis_type,sale_unit)values('$bill_invoice_id','$prodid','$prodname','$ordquantiy','$cgstamt','$sgstamt','$proprice','$dis_type','$dis_per','$cess_per_amt','$cess_percentage','$cess_final_amt','$pro_discount','$pro_imei_no','$igstamt','$pro_actual_qty','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt','$probagtype','$probagqty','$consume_flag','$d_type','$sale_unit')");
				}
				$clear_cart=mysqli_query($con,"update tbl_party_transaction_performa set status='Completed' WHERE transaction_id='$perdoc_no' AND status='Pending' ");
					
				if($invoice_type1=="Receipt")
				{
					$response['url']="download_receipt_invoice.php?id=".$bill_invoice_id."&user_id=".$dis_id;
					$response['url_hindi']="download_receipt_invoice.php?id=".$bill_invoice_id."&user_id=".$dis_id;
				}
				else if($serial_bill=="Yes")
				{
					$response['url']="download_serialno_receipt.php?id=".$bill_invoice_id."&user_id=".$dis_id."&lng=eng";
					$response['url_hindi']="download_serialno_receipt.php?id=".$bill_invoice_id."&user_id=".$dis_id."&lng=hnd";
				}
				else if($check_product_type=="FMCG")
				{
					$response['url']="download-cess-receipt.php?id=".$bill_invoice_id."&user_id=".$dis_id."&lng=eng";
					$response['url_hindi']="download-cess-receipt.php?id=".$bill_invoice_id."&user_id=".$dis_id."&lng=hnd";
				} 
				else
				{
					$response['url']="download_receipt.php?id=".$bill_invoice_id."&user_id=".$dis_id."&lng=eng";
					$response['url_hindi']="download_receipt.php?id=".$bill_invoice_id."&user_id=".$dis_id."&lng=hnd";
				}
				$response['success']=1;
				$response['details']=$sd;
				$response['pmode']=$pmode;
				if($dist_dsr_require=='Yes')
				{
					include("cash_bank_effect_class.php");
					if($pmode=='Cash' && $cash_amt>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$da);
					}
					else if($pmode=='Both' && $cash_amt>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$da);
					}
					else if(($pmode=='Online' || $pmode=="Wallet") && $final_amt>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->bankcollection($dis_id,$deposit_bank_id,$final_amt,$da);
					}
				}
				
			}			
			else
			{
				$response['success']=0;
				$response['details']="Insertion Error...!!";
			}		
				
		}
		else
		{
			$response['success']=0;
			$response['details']="Insertion Error...!!";
		}
	}	
}	
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}
echo json_encode($response);
?> 
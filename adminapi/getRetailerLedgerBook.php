<?php
include("../../connect.php");
$response = array();
if(isset($_POST['dist_id']) && isset($_POST['retailer_id']) && isset($_POST['from_date']) && isset($_POST['to_date']))
{
	$cparty = $_POST['retailer_id'];
	$session_dist_ver = $_POST['dist_id'];
	$cdate1 = $_POST['from_date'];
	$cdate2 = $_POST['to_date'];
	$data_flag=0;
	$current_fy_check  = date("Y-m-d");
	if(date("m")>3)
		$current_fy_check=date('Y-04-01', strtotime($current_fy_check));
	else
	{
		$current_fy_check  = (date("Y")-1).'-01-01';
		$current_fy_check=date('Y-04-01', strtotime($current_fy_check));
	}
	
	$bill_financial_year=mysqli_query($con,"SELECT * FROM tbl_distributor_previous_data_record where start_date>='$cdate1' && end_date<='$cdate2'");
	if(mysqli_num_rows($bill_financial_year)>0)
	{
		while($f_data_fetch=mysqli_fetch_assoc($bill_financial_year))
		{
			$extra_link1=$f_data_fetch['txn_table'];
			$extra_link2=$f_data_fetch['txn_detail_table'];
		}
	}
	else
	{
		$extra_link1='tbl_party_transaction';
		$extra_link2='tbl_party_transaction_detail';
	}
	
	$income=array();
	if($data_flag==0)
	{
		$total_debit=$total_credit=$total_opening=$total_closing=0;
		$opendate=$cdate1;
		$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$session_dist_ver' and party_id='$cparty' and date<'$cdate1' ORDER BY date DESC LIMIT 1");
		if(mysqli_num_rows($res_check_2nd)>0)
		{
			$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
			$total_opening = $rows_res_check['closing_amount'];
			$opendate=$rows_res_check['date'];
		}
		if($total_opening>0) {
			$total_debit=$total_debit+$total_opening;
			$object = new stdClass;
			$object->date = $opendate;
			$object->particular =  "By Opening Balance";
			$object->vch_type = "";
			$object->vch_no = "";
			$object->taxable_amt = "";
			$object->gst_Amt = "";
			$object->debit = round($total_opening,2);
			$object->credit = "0";
			array_push($income, $object);
		}
		else
		{
			$total_credit=$total_credit+($total_opening * -1);
			$object = new stdClass;
			$object->date = $opendate;
			$object->particular =  "By Opening Balance";
			$object->vch_type = "";
			$object->vch_no = "";
			$object->taxable_amt = "";
			$object->gst_Amt = "";
			$object->debit = "0";
			$object->credit = round($total_opening * -1 ,2);
			array_push($income, $object);
		}
		$res_party_add = mysqli_query($con,"SELECT * FROM tbl_party where distributor_id='$session_dist_ver' and party_id='$cparty' and tb_insertdatetime>='$cdate1' and tb_insertdatetime<='$cdate2' and outstanding_amount>0");
		if(mysqli_num_rows($res_party_add)>0)
		{
			$rows_res_partyadd = mysqli_fetch_assoc($res_party_add);
			$total_debit=$total_debit+$rows_res_partyadd['outstanding_amount'];
			$object = new stdClass;
			$object->date = $rows_res_partyadd['tb_insertdatetime'];
			$object->particular =  "To Receive (Outstanding)";
			$object->vch_type = "";
			$object->vch_no = "";
			$object->taxable_amt = "";
			$object->gst_Amt = "";
			$object->debit = $rows_res_partyadd['outstanding_amount'];
			$object->credit = "0";
			array_push($income, $object);
		}
		$rescredit1 = mysqli_query($con,"select * from tbl_receipt_transaction where status='Complete' and receipt_date>='$cdate1' and receipt_date<='$cdate2' and party_id='$cparty'");
		if(mysqli_num_rows($rescredit1)>0)
		{
			while($fetch_product_credit=mysqli_fetch_assoc($rescredit1))
			{	
				if($fetch_product_credit['payment_mode']=="Cash" || $fetch_product_credit['payment_mode']=="Cheque" || $fetch_product_credit['payment_mode']=="Online" || $fetch_product_credit['payment_mode']=="Wallet") 
				{
					$total_credit=$total_credit+$fetch_product_credit['total_amount']+$fetch_product_credit['receipt_disc_amt'];
					$object = new stdClass;
					$object->date = $fetch_product_credit['receipt_date'];
					$object->particular =  "By ".$fetch_product_credit['payment_mode'];
					$object->vch_type = "Receipt";
					$object->vch_no = $fetch_product_credit['cheque_no'];
					$object->taxable_amt = "";
					$object->gst_Amt = "";
					$object->debit = "0";
					$object->credit = round($fetch_product_credit['total_amount']+$fetch_product_credit['receipt_disc_amt'],2);
					array_push($income, $object);
				}
			}
		}
		$res_advance = mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn where party_id='$cparty' and receipt_date>='$cdate1' and receipt_date<='$cdate2' and status='Complete'");
		if(mysqli_num_rows($res_advance)>0)
		{
			while($rows_advance = mysqli_fetch_assoc($res_advance))
			{
				$total_credit=$total_credit+$rows_advance['total_amount'];
				$object = new stdClass;
				$object->date = $rows_advance['receipt_date'];
				$object->particular =  "By Payment In";
				$object->vch_type = "Receipt";
				$object->vch_no = $rows_advance['cheque_no'];
				$object->taxable_amt = "";
				$object->gst_Amt = "";
				$object->debit = "0";
				$object->credit = $rows_advance['total_amount'];
				array_push($income, $object);
			}
		}
	
		$res = mysqli_query($con,"SELECT * FROM ".$extra_link1.",tbl_party where ".$extra_link1.".transaction_to=tbl_party.party_id and tbl_party.distributor_id='$session_dist_ver' and ".$extra_link1.".transaction_date>='$cdate1' and ".$extra_link1.".transaction_date<='$cdate2' and ".$extra_link1.".transaction_to='$cparty' and ".$extra_link1.".payment_mode!='' and ".$extra_link1.".bill_type in ('Tax Invoice', 'Payout')");
		if(mysqli_num_rows($res)>0)
		{     
			while($fetch_product2=mysqli_fetch_assoc($res))
			{
				$total_debit=$total_debit+$fetch_product2['final_amt'];
				$transaction_id=$fetch_product2['transaction_id'];
				$res_detail_data = mysqli_query($con,"select SUM(CGST_amount) AS cgstamt, SUM(SGST_amount) as sgstamt,SUM(IGST_amount) as igstamt from ".$extra_link2." WHERE transaction_id='$transaction_id'");
				$fetch_product_gst=mysqli_fetch_assoc($res_detail_data);

				$object = new stdClass;
				$object->date = $fetch_product2['transaction_date'];
				$object->particular =  "To Sale";
				$object->vch_type = $fetch_product2['bill_type'];
				$object->vch_no = $fetch_product2['transaction_bill_number'];
				$object->taxable_amt = $fetch_product2['final_amt']-($fetch_product_gst['cgstamt']+$fetch_product_gst['sgstamt']+$fetch_product_gst['igstamt']);
				$object->gst_Amt = $fetch_product_gst['cgstamt']+$fetch_product_gst['sgstamt']+$fetch_product_gst['igstamt'];
				$object->debit = $fetch_product2['final_amt'];
				$object->credit = "0";
				array_push($income, $object);

				if($fetch_product2['payment_mode']=="Cash" || $fetch_product2['payment_mode']=="Cheque" || $fetch_product2['payment_mode']=="Online" || $fetch_product2['payment_mode']=="Wallet")
				{
					$total_credit=$total_credit+$fetch_product2['final_amt'];
					$object = new stdClass;
					$object->date = $fetch_product2['transaction_date'];
					$object->particular =  "By ".$fetch_product2['payment_mode'];
					$object->vch_type = "Receipt";
					$object->vch_no = $fetch_product2['transaction_bill_number'];
					$object->taxable_amt = "";
					$object->gst_Amt = "";
					$object->debit = "0";
					$object->credit = $fetch_product2['final_amt'];
					array_push($income, $object);
				}
				else if($fetch_product2['payment_mode'] == "Both") 
				{
					$total_credit=$total_credit + $fetch_product2['cash_amount'];
					$total_credit=$total_credit + $fetch_product2['cheque_amount'];
					$object = new stdClass;
					$object->date = $fetch_product2['transaction_date'];
					$object->particular = "By Cash";
					$object->vch_type = "Receipt";
					$object->vch_no = $fetch_product2['transaction_bill_number'];
					$object->taxable_amt = "";
					$object->gst_Amt = "";
					$object->debit = "0";
					$object->credit = $fetch_product2['cash_amount'];
					array_push($income, $object);

					$object = new stdClass;
					$object->date = $fetch_product2['transaction_date'];
					$object->particular =  "By Cheque";
					$object->vch_type = "Receipt";
					$object->vch_no = $fetch_product2['transaction_bill_number'];
					$object->taxable_amt = "";
					$object->gst_Amt = "";
					$object->debit = "0";
					$object->credit = $fetch_product2['cheque_amount'];
					array_push($income, $object);
				}
			}
		}
		
		if($current_fy_check!=$cdate1 && $extra_link1!='tbl_party_transaction')
		{
			$res = mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_party_transaction.transaction_to='$cparty' and tbl_party_transaction.payment_mode!='' and tbl_party_transaction.bill_type in ('Tax Invoice', 'Payout')");
			if(mysqli_num_rows($res)>0)
			{     
				while($fetch_product2=mysqli_fetch_assoc($res))
				{
					$total_debit=$total_debit+$fetch_product2['final_amt'];
					$transaction_id=$fetch_product2['transaction_id'];
					$res_detail_data = mysqli_query($con,"select SUM(CGST_amount) AS cgstamt, SUM(SGST_amount) as sgstamt,SUM(IGST_amount) as igstamt from tbl_party_transaction_detail WHERE transaction_id='$transaction_id'");
					$fetch_product_gst=mysqli_fetch_assoc($res_detail_data);

					$object = new stdClass;
					$object->date = $fetch_product2['transaction_date'];
					$object->particular =  "To Sale";
					$object->vch_type = $fetch_product2['bill_type'];
					$object->vch_no = $fetch_product2['transaction_bill_number'];
					$object->taxable_amt = $fetch_product2['final_amt']-($fetch_product_gst['cgstamt']+$fetch_product_gst['sgstamt']+$fetch_product_gst['igstamt']);
					$object->gst_Amt = $fetch_product_gst['cgstamt']+$fetch_product_gst['sgstamt']+$fetch_product_gst['igstamt'];
					$object->debit = $fetch_product2['final_amt'];
					$object->credit = "0";
					array_push($income, $object);

					if($fetch_product2['payment_mode']=="Cash" || $fetch_product2['payment_mode']=="Cheque" || $fetch_product2['payment_mode']=="Online" || $fetch_product2['payment_mode']=="Wallet")
					{
						$total_credit=$total_credit+$fetch_product2['final_amt'];
						$object = new stdClass;
						$object->date = $fetch_product2['transaction_date'];
						$object->particular =  "By ".$fetch_product2['payment_mode'];
						$object->vch_type = "Receipt";
						$object->vch_no = $fetch_product2['transaction_bill_number'];
						$object->taxable_amt = "";
						$object->gst_Amt = "";
						$object->debit = "0";
						$object->credit = $fetch_product2['final_amt'];
						array_push($income, $object);
					}
					else if($fetch_product2['payment_mode'] == "Both") 
					{
						$total_credit=$total_credit + $fetch_product2['cash_amount'];
						$total_credit=$total_credit + $fetch_product2['cheque_amount'];
						$object = new stdClass;
						$object->date = $fetch_product2['transaction_date'];
						$object->particular = "By Cash";
						$object->vch_type = "Receipt";
						$object->vch_no = $fetch_product2['transaction_bill_number'];
						$object->taxable_amt = "";
						$object->gst_Amt = "";
						$object->debit = "0";
						$object->credit = $fetch_product2['cash_amount'];
						array_push($income, $object);

						$object = new stdClass;
						$object->date = $fetch_product2['transaction_date'];
						$object->particular =  "By Cheque";
						$object->vch_type = "Receipt";
						$object->vch_no = $fetch_product2['transaction_bill_number'];
						$object->taxable_amt = "";
						$object->gst_Amt = "";
						$object->debit = "0";
						$object->credit = $fetch_product2['cheque_amount'];
						array_push($income, $object);
					}
				}
			}
		}
		
		$bill_financial_year_receipt=mysqli_query($con,"SELECT txn_table,start_date,end_date FROM tbl_distributor_previous_data_record order by detail_id asc");
		while($f_receipt_fetch=mysqli_fetch_assoc($bill_financial_year_receipt))
		{
			$extra_link_receipt=$f_receipt_fetch['txn_table'];		
			$bill_fyear_receipt=mysqli_query($con,"SELECT txn_table FROM tbl_distributor_previous_data_record_receipt order by detail_id asc");
			while($fy_receipt_fetch=mysqli_fetch_assoc($bill_fyear_receipt))
			{
				$extralink_receipt=$fy_receipt_fetch['txn_table'];	
				$rescredit1 = mysqli_query($con,"select ".$extralink_receipt.".*,".$extra_link_receipt.".transaction_date,".$extra_link_receipt.".transaction_bill_number from ".$extralink_receipt.",".$extra_link_receipt." where ".$extralink_receipt.".transaction_id = ".$extra_link_receipt.".transaction_id and ".$extralink_receipt.".status='Complete' and ".$extralink_receipt.".receipt_date>='$cdate1' and ".$extralink_receipt.".receipt_date<='$cdate2' and ".$extra_link_receipt.".transaction_to='$cparty'");
				while($fetch_product_credit=mysqli_fetch_assoc($rescredit1))
				{	
					$bill_receipt_detail_data=$fetch_product_credit['txn_receipt_id'].' ('.$fetch_product_credit['transaction_bill_number'].')';
					if($fetch_product_credit['payment_mode']=="Cash" || $fetch_product_credit['payment_mode']=="Cheque" || $fetch_product_credit['payment_mode']=="Online" || $fetch_product_credit['payment_mode']=="Wallet") 
					{
							$total_credit=$total_credit+$fetch_product_credit['total_amount']+$fetch_product_credit['receipt_disc_amt'];
							$object = new stdClass;
							$object->date = $fetch_product_credit['receipt_date'];
							$object->particular = "By ".$fetch_product_credit['payment_mode'];
							$object->vch_type = "Receipt";
							$object->vch_no = $fetch_product_credit['txn_receipt_id'];
							$object->taxable_amt = "";
							$object->gst_Amt = "";
							$object->debit = "0";
							$object->credit = $fetch_product_credit['total_amount']+$fetch_product_credit['receipt_disc_amt'];
							array_push($income, $object);
					}
					else if($fetch_product_credit['payment_mode']=="Both") 
					{
							$total_credit=$total_credit+$fetch_product_credit['cash_amount']+$fetch_product_credit['receipt_disc_amt'];
							$total_credit=$total_credit+$fetch_product_credit['cheque_amount'];
							$object = new stdClass;
							$object->date = $fetch_product_credit['receipt_date'];
							$object->particular = "By Cash";
							$object->vch_type = "Receipt";
							$object->vch_no = $fetch_product_credit['txn_receipt_id'];
							$object->taxable_amt = "";
							$object->gst_Amt = "";
							$object->debit = "0";
							$object->credit = $fetch_product_credit['cash_amount']+$fetch_product_credit['receipt_disc_amt'];
							array_push($income, $object);
							
							$object = new stdClass;
							$object->date = $fetch_product_credit['receipt_date'];
							$object->particular = "By Cheque";
							$object->vch_type = "Receipt";
							$object->vch_no = $fetch_product_credit['txn_receipt_id'];
							$object->taxable_amt = "";
							$object->gst_Amt = "";
							$object->debit = "0";
							$object->credit = $fetch_product_credit['cheque_amount'];
							array_push($income, $object);
					
					} 
				}
			}
		}
		
		$res_debitnote = mysqli_query($con,"SELECT *,sum(final_net_amt) as final_netamt,sum(cgst_amt+sgst_amt+igst_amt) as finalgstamt FROM tbl_party_credit_note where distributor_id='$session_dist_ver' and party_id='$cparty' and bill_date>='$cdate1' and bill_date<='$cdate2' group by bill_no,unique_bill");
		if(mysqli_num_rows($res_debitnote)>0)
		{
			while($rows_data = mysqli_fetch_assoc($res_debitnote))
			{
				$total_credit=$total_credit+round($rows_data['final_netamt'],2);	
				$taxableamt=$rows_data['final_netamt']-$rows_data['finalgstamt'];				
				$object = new stdClass;
				$object->date = $rows_data['bill_date'];
				$object->particular = "By Credit-Note";
				$object->vch_type = "Receipt";
				$object->vch_no = $rows_data['bill_no'];
				$object->taxable_amt = round($taxableamt,2);
				$object->gst_Amt = round($rows_data['finalgstamt'],2);
				$object->debit = "0";
				$object->credit = round($rows_data['final_netamt'],2);
				array_push($income, $object);
			}
		}
			
	    $object = new stdClass;
		$object->date = "";
		$object->particular =  "Total";
		$object->vch_type = "";
		$object->vch_no = "";
		$object->taxable_amt = "";
		$object->gst_Amt = "";
		$object->debit =  round($total_debit,2);
		$object->credit = round($total_credit,2);
		array_push($income, $object);
		
		$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_sale_party_balance where distributor_id='$session_dist_ver' and party_id='$cparty' and date<='$cdate2' ORDER BY date DESC LIMIT 1");
		if(mysqli_num_rows($res_check_2nd)>0)
		{
			$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
			$total_closing = $rows_res_check['closing_amount'];
		}
		if($total_closing>0) 
		{
			$object = new stdClass;
			$object->date = "";
			$object->particular =  "By Closing Balance";
			$object->vch_type = "";
			$object->vch_no = "";
			$object->taxable_amt = "";
			$object->gst_Amt = "";
			$object->debit =  round($total_closing,2);
			$object->credit = "0";
			array_push($income, $object);
		}
		else
		{
			$object = new stdClass;
			$object->date = "";
			$object->particular =  "By Closing Balance";
			$object->vch_type = "";
			$object->vch_no = "";
			$object->taxable_amt = "";
			$object->gst_Amt = "";
			$object->debit =  "0";
			$object->credit = round($total_closing * -1,2);
			array_push($income, $object);
		}
		$response['ledger']=$income;
	}
	else
	{
		$response['ledger']=$income;
	}
	$response['total_debit']=round($total_debit,2);
	$response['total_credit']=round($total_credit,2);
	if($total_closing>0)
		$response['closing_amt']=round($total_closing);
	else
		$response['closing_amt']=round($total_closing*(-1));
	
	$response['success']="1";	
	$response['details']="Data Success";
}
else{
	$response['success']="0";
	$response['details']="Unable to get response. Data is incomplete";
}
echo json_encode($response);
?> 
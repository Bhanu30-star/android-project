<?php
include("../../connect.php");
$response = array();
$current_fy_check = date("Y-m-d");
if (date("m") > 3)
{
	$current_fy_check = date('Y-04-01', strtotime($current_fy_check));
	$cdateval = date("Y").'_'.(date("Y")+1);
}
else {
	$current_fy_check = (date("Y") - 1) . '-01-01';
	$current_fy_check = date('Y-04-01', strtotime($current_fy_check));
	$cdateval = (date("Y")-1).'_'.date("Y");
}
if(isset($_POST['searchdate1']) && isset($_POST['searchdate2']) && isset($_POST['distributor_id']) && isset($_POST['searchuser']))
{
	$session_dist_ver=$_POST['distributor_id'];
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	$search_party=$_POST['searchuser'];
	
	$bill_financial_year = mysqli_query($con, "SELECT * FROM tbl_distributor_previous_data_record WHERE start_date<='$cdate1' && end_date>='$cdate2'");
	if (mysqli_num_rows($bill_financial_year) > 0) {
		while ($f_data_fetch = mysqli_fetch_assoc($bill_financial_year)) {
			$extra_link1 = $f_data_fetch['purchase_txn_table'];
			$extra_link2 = $f_data_fetch['purchase_charge_table'];
		}
	}
	
	$product=array();
	$res_fse = mysqli_query($con,"select purchase_party_id from tbl_purchase_party where distributor_id='$session_dist_ver' and party_name LIKE '%".$search_party."%'");  
	if(mysqli_num_rows($res_fse)>0)
	{
		$fetch_fse=mysqli_fetch_assoc($res_fse);
		$cparty=$fetch_fse['purchase_party_id'];
		$total_debit=$total_credit=$total_opening=$total_closing=0;
		$opendate=$cdate1;
		$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_purchase_party_balance where distributor_id='$session_dist_ver' and party_id='$cparty' and date<'$cdate1' ORDER BY date DESC LIMIT 1");
		if(mysqli_num_rows($res_check_2nd)>0)
		{
			$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
			$total_opening = $rows_res_check['closing_amount'];
			$opendate=$rows_res_check['date'];
	    }
		if($total_opening>0) 
		{
			$total_debit=$total_debit+$total_opening;
			$product['bill_date']=$opendate;
			$product['particular']='By Opening Balance';
			$product['vch_type']="";
			$product['vch_vo.']="";
			$product['taxable_amt']="";
			$product['GST_amt']="";
			$product['debit']= round($total_opening,2);
			$product['credit']= '0';
			$response['ledger_book'][]=$product;
		}
		else
		{
			$total_credit=$total_credit+($total_opening * -1);
			$product['bill_date']=$opendate;
			$product['particular']='By Opening Balance';
			$product['vch_type']="";
			$product['vch_vo.']="";
			$product['taxable_amt']="";
			$product['GST_amt']="";
			$product['debit']= "0";
			$product['credit']= round($total_opening,2);
			$response['ledger_book'][]=$product;
		}
		
		$startDate = $cdate1.' 00:00:01';
		$endDate = $cdate2.' 23:59:59';
		$res_party_add = mysqli_query($con,"SELECT * FROM tbl_purchase_party where distributor_id='$session_dist_ver' and purchase_party_id='$cparty' and insert_datetime>='$startDate' and insert_datetime<='$endDate' and outstanding_amount>0");
		if(mysqli_num_rows($res_party_add)>0)
		{
			$rows_res_partyadd = mysqli_fetch_assoc($res_party_add);
			$total_debit=$total_debit+$rows_res_partyadd['outstanding_amount'];
			$product['bill_date']=date("Y-m-d", strtotime($rows_res_partyadd['insert_datetime']));
			$product['particular']='To Pay (Outstanding)';
			$product['vch_type']="";
			$product['vch_vo.']="";
			$product['taxable_amt']="";
			$product['GST_amt']="";
			$product['debit']= $rows_res_partyadd['outstanding_amount'];
			$product['credit']= "0";
			$response['ledger_book'][]=$product;
		}
		
		
		$rescredit1 = mysqli_query($con,"select * from tbl_purchase_payment_transaction where distributor_id='$session_dist_ver' and status='Complete' and payment_date>='$cdate1' and payment_date<='$cdate2' and party_id='$cparty'");
		if(mysqli_num_rows($rescredit1)>0)
		{
			while($fetch_product_credit=mysqli_fetch_assoc($rescredit1))
			{	
				if($fetch_product_credit['payment_mode']=="Cash" || $fetch_product_credit['payment_mode']=="Cheque" || $fetch_product_credit['payment_mode']=="Online" || $fetch_product_credit['payment_mode']=="Adjustment") 
				{
					$total_credit=$total_credit+$fetch_product_credit['total_amount']+$fetch_product_credit['receive_disc_amt'];	
					$product['bill_date']=$fetch_product_credit['payment_date'];
					$product['particular']='By '.$fetch_product_credit['payment_mode'];
					$product['vch_type']="Receipt";
					$product['vch_vo.']=$fetch_product_credit['cheque_no'];
					$product['taxable_amt']="";
					$product['GST_amt']="";
					$product['debit']= "0";
					$product['credit']= round($fetch_product_credit['total_amount']+$fetch_product_credit['receive_disc_amt'],2);
					$response['ledger_book'][]=$product;
				}
			}
		}
		
		$res_advance = mysqli_query($con,"SELECT * FROM tbl_purchase_advance_txn_detail where distributor_id='$session_dist_ver' and party_id='$cparty' and receipt_date>='$cdate1' and receipt_date<='$cdate2' and status='Complete'");
		if(mysqli_num_rows($res_advance)>0)
		{
			while($rows_advance = mysqli_fetch_assoc($res_advance))
			{
				$total_credit=$total_credit+$rows_advance['total_amount'];	
				$product['bill_date']=$rows_advance['receipt_date'];
				$product['particular']='By Payment Out';
				$product['vch_type']="Receipt";
				$product['vch_vo.']=$rows_advance['cheque_no'];
				$product['taxable_amt']="";
				$product['GST_amt']="";
				$product['debit']= "0";
				$product['credit']= $rows_advance['total_amount'];
				$response['ledger_book'][]=$product;
			}
		}
			
	
		$res = mysqli_query($con,"select sum(final_net_amt) as finalnetamt,sum(cgst_amt) as finalcgstamt, sum(sgst_amt) as finalsgstamt, sum(igst_amt) as finaligstamt,bill_no,bill_date, unique_bill,payment_mode from " . $extra_link1 . " where distributor_id='$session_dist_ver' and bill_date>='$cdate1' AND bill_date<='$cdate2' and txn_type='Add' and conversion='' and purchase_category !='Opening Stock' and party_id='$cparty' group by bill_no, unique_bill order by bill_date asc");
		if(mysqli_num_rows($res)>0)
		{     
			while($fetch_product2=mysqli_fetch_assoc($res))
			{
				$res_detail = mysqli_query($con,"select net_amt from " . $extra_link2 . " where distributor_id='$session_dist_ver' and bill_date='".$fetch_product2['bill_date']."' AND bill_no='".$fetch_product2['bill_no']."' and unique_bill='".$fetch_product2['unique_bill']."'");
				if (mysqli_num_rows($res_detail) > 0) {
					$fetch_data = mysqli_fetch_assoc($res_detail);
					$total_taxable = $fetch_data['net_amt'];
					if ($total_taxable == 0)
						$total_taxable = round($fetch_product2['finalnetamt'], 2);
				} else {
					$total_taxable = round($fetch_product2['finalnetamt'], 2);
				}
				
				$total_debit=$total_debit+$total_taxable;
				
				$product['bill_date']=$fetch_product2['bill_date'];
				$product['particular']='To Purchase';
				$product['vch_type']='Bill';
				$product['vch_vo.']=$fetch_product2['bill_no'];
				$product['taxable_amt']=round($total_taxable-($fetch_product2['finalcgstamt']+$fetch_product2['finalsgstamt']+$fetch_product2['finaligstamt']),2);
				$product['GST_amt']=round($fetch_product2['finalcgstamt']+$fetch_product2['finalsgstamt']+$fetch_product2['finaligstamt'],2);
				$product['debit']= round($total_taxable,2);
				$product['credit']= '0';
				$response['ledger_book'][]=$product;
			
				if($fetch_product2['payment_mode']=="Cash" || $fetch_product2['payment_mode']=="Cheque" || $fetch_product2['payment_mode']=="Online")
				{
					$total_credit=$total_credit+$fetch_product2['finalnetamt'];
					$product['bill_date']=$fetch_product2['bill_date'];
					$product['particular']='By '.$fetch_product2['payment_mode'];
					$product['vch_type']='Receipt';
					$product['vch_vo.']=$fetch_product2['bill_no'];
					$product['taxable_amt']='';
					$product['GST_amt']='';
					$product['debit']= '0';
					$product['credit']= round($fetch_product2['finalnetamt'],2);
					$response['ledger_book'][]=$product;
				}
			}
		}
		
		
		
		if ($current_fy_check != $cdate1 && $extra_link1!='tbl_distributor_transaction') {
			$res = mysqli_query($con,"select sum(final_net_amt) as finalnetamt,sum(cgst_amt) as finalcgstamt, sum(sgst_amt) as finalsgstamt, sum(igst_amt) as finaligstamt,bill_no,bill_date, unique_bill,payment_mode from tbl_distributor_transaction where distributor_id='$session_dist_ver' and bill_date>='$cdate1' AND bill_date<='$cdate2' and txn_type='Add' and conversion='' and purchase_category !='Opening Stock' and party_id='$cparty' group by bill_no, unique_bill order by bill_date asc");
			if(mysqli_num_rows($res)>0)
			{     
				while($fetch_product2=mysqli_fetch_assoc($res))
				{
					$res_detail = mysqli_query($con,"select net_amt from tbl_distributor_transaction_charges where distributor_id='$session_dist_ver' and bill_date='".$fetch_product2['bill_date']."' AND bill_no='".$fetch_product2['bill_no']."' and unique_bill='".$fetch_product2['unique_bill']."'");
					if (mysqli_num_rows($res_detail) > 0) {
						$fetch_data = mysqli_fetch_assoc($res_detail);
						$total_taxable = $fetch_data['net_amt'];
						if ($total_taxable == 0)
							$total_taxable = round($fetch_product2['finalnetamt'], 2);
					} else {
						$total_taxable = round($fetch_product2['finalnetamt'], 2);
					}
													
					$total_debit=$total_debit+$total_taxable;
					
					$product['bill_date']=$fetch_product2['bill_date'];
					$product['particular']='To Purchase';
					$product['vch_type']='Bill';
					$product['vch_vo.']=$fetch_product2['bill_no'];
					$product['taxable_amt']=round($total_taxable-($fetch_product2['finalcgstamt']+$fetch_product2['finalsgstamt']+$fetch_product2['finaligstamt']),2);
					$product['GST_amt']=round($fetch_product2['finalcgstamt']+$fetch_product2['finalsgstamt']+$fetch_product2['finaligstamt'],2);
					$product['debit']= round($total_taxable,2);
					$product['credit']= '0';
					$response['ledger_book'][]=$product;
				
					if($fetch_product2['payment_mode']=="Cash" || $fetch_product2['payment_mode']=="Cheque" || $fetch_product2['payment_mode']=="Online")
					{
						$total_credit=$total_credit+$fetch_product2['finalnetamt'];
						$product['bill_date']=$fetch_product2['bill_date'];
						$product['particular']='By '.$fetch_product2['payment_mode'];
						$product['vch_type']='Receipt';
						$product['vch_vo.']=$fetch_product2['bill_no'];
						$product['taxable_amt']='';
						$product['GST_amt']='';
						$product['debit']= '0';
						$product['credit']= round($fetch_product2['finalnetamt'],2);
						$response['ledger_book'][]=$product;
					}
				}
			}
		}
		
		
		$bill_financial_year_receipt = mysqli_query($con, "SELECT purchase_txn_table,start_date,end_date FROM tbl_distributor_previous_data_record order by detail_id asc");
		while ($f_receipt_fetch = mysqli_fetch_assoc($bill_financial_year_receipt)) {
			$extra_link_receipt = $f_receipt_fetch['purchase_txn_table'];
			$rescredit1 = mysqli_query($con, "select * from tbl_purchase_payment_transaction where distributor_id='$session_dist_ver' and status='Complete' and payment_date>='$cdate1' and payment_date<='$cdate2' and unique_bill in (select unique_bill from " . $extra_link_receipt . " where distributor_id='$session_dist_ver' and txn_type='Add' and conversion='' and purchase_category !='Opening Stock' and party_id='$cparty')");
			if (mysqli_num_rows($rescredit1) > 0) {
				while ($fetch_product_credit = mysqli_fetch_assoc($rescredit1)) 
				{
					if ($fetch_product_credit['payment_mode'] == "Cash" || $fetch_product_credit['payment_mode'] == "Cheque" || $fetch_product_credit['payment_mode'] == "Online") 
					{
						$total_credit = $total_credit + $fetch_product_credit['total_amount'] + $fetch_product_credit['receive_disc_amt'];
						$total_credit=$total_credit+$fetch_product_credit['total_amount']+$fetch_product_credit['receive_disc_amt'];
						$product['bill_date']=$fetch_product_credit['payment_date'];
						$product['particular']='By '.$fetch_product_credit['payment_mode'];
						$product['vch_type']='Receipt';
						$product['vch_vo.']=$fetch_product_credit['cheque_no'];
						$product['taxable_amt']='';
						$product['GST_amt']='';
						$product['debit']= '0';
						$product['credit']= round($fetch_product_credit['total_amount']+$fetch_product_credit['receive_disc_amt'],2);
						$response['ledger_book'][]=$product;
					}
				}
			}
		}
		
		$res_debitnote = mysqli_query($con,"SELECT *,sum(final_net_amt) as final_netamt FROM tbl_party_debit_note where distributor_id='$session_dist_ver' and purchase_party_id='$cparty' and bill_date>='$cdate1' and bill_date<='$cdate2' group by bill_no, unique_bill");
		if(mysqli_num_rows($res_debitnote)>0)
		{
			while($rows_data = mysqli_fetch_assoc($res_debitnote))
			{
				$total_credit=$total_credit+$rows_data['final_netamt'];
				$product['bill_date']=$rows_data['bill_date'];
				$product['particular']='By Debit-Note';
				$product['vch_type']='Receipt';
				$product['vch_vo.']=$rows_data['bill_no'];
				$product['taxable_amt']='';
				$product['GST_amt']='';
				$product['debit']= '0';
				$product['credit']= $rows_data['final_netamt'];
				$response['ledger_book'][]=$product;
			}
		}
		$res_debitnote = mysqli_query($con,"SELECT *,sum(return_net_amt) as final_netamt FROM tbl_purchase_return_transaction where distributor_id='$session_dist_ver' and party_id='$cparty' and transaction_date>='$cdate1' and transaction_date<='$cdate2' group by bill_no,unique_bill,debit_note_receipt");
		if(mysqli_num_rows($res_debitnote)>0)
		{
			while($rows_data = mysqli_fetch_assoc($res_debitnote))
			{
				$total_credit=$total_credit+$rows_data['final_netamt'];
				$product['bill_date']=$rows_data['transaction_date'];
				$product['particular']='By Debit-Note';
				$product['vch_type']='Receipt';
				$product['vch_vo.']=$rows_data['debit_note_receipt'];
				$product['taxable_amt']='';
				$product['GST_amt']='';
				$product['debit']= '0';
				$product['credit']= $rows_data['final_netamt'];
				$response['ledger_book'][]=$product;
			}
		}
		
		$product['bill_date']="";
		$product['particular']="Total";
		$product['vch_type']="";
		$product['vch_vo.']="";
		$product['taxable_amt']='';
		$product['GST_amt']='';
		$product['debit']= round($total_debit,2);
		$product['credit']= round($total_credit,2);
		$response['ledger_book'][]=$product;
		
		$res_check_2nd = mysqli_query($con,"SELECT * FROM tbl_purchase_party_balance where distributor_id='$session_dist_ver' and party_id='$cparty' and date<='$cdate2' ORDER BY date DESC LIMIT 1");
		if(mysqli_num_rows($res_check_2nd)>0)
		{
			$rows_res_check = mysqli_fetch_assoc($res_check_2nd);
			$total_closing = $rows_res_check['closing_amount'];
		}
		if($total_closing>0) 
		{
			$product['bill_date']="";
			$product['particular']="By Closing Balance";
			$product['vch_type']="";
			$product['vch_vo.']="";
			$product['taxable_amt']='';
			$product['GST_amt']='';
			$product['debit']= round($total_closing,2);
			$product['credit']= "0";
			$response['ledger_book'][]=$product;
		
		}
		else
		{
			$product['bill_date']="";
			$product['particular']="By Closing Balance";
			$product['vch_type']="";
			$product['vch_vo.']="";
			$product['taxable_amt']='';
			$product['GST_amt']='';
			$product['debit']= "0";
			$product['credit']= round($total_closing * -1,2);
			$response['ledger_book'][]=$product;
		}
	}
	else
	{
		$response['ledger_book']=$product;
	}
	
	
	$response['total_debit']=round($total_debit,2);
	$response['total_credit']=round($total_credit,2);
	if($total_closing>0)
		$response['closing_amt']=round($total_closing);
	else
		$response['closing_amt']=round($total_closing*(-1));
	
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>
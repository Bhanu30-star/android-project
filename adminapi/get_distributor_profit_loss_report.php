<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['searchdate1']) && isset($_POST['searchdate2']))
{
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	$session_dist_ver=$_POST['distributor_id'];
	
	$total_profit_amt=$total_loss_amt=0;
	$total_sale_amt=0;
	$sale_detail = mysqli_query($con,"select final_amt from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and  tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type!='Receipt'");
	while($fetch_sale=mysqli_fetch_assoc($sale_detail))
	{
		$total_sale_amt=$total_sale_amt+$fetch_sale['final_amt'];
	}
	$total_profit_amt=$total_profit_amt+$total_sale_amt;
	
	$response['Sale(+)']=strval($total_sale_amt);
	$total_creditnote_amt=0;
	$res_creditnote = mysqli_query($con,"SELECT *,sum(final_net_amt) as final_netamt FROM tbl_party_credit_note where distributor_id='$session_dist_ver' and bill_date>='$cdate1' and bill_date<='$cdate2' group by bill_no,unique_bill");
	while($rows_data = mysqli_fetch_assoc($res_creditnote))
	{
		$total_creditnote_amt=$total_creditnote_amt+round($rows_data['final_netamt'],2);
	}
	$total_loss_amt=$total_loss_amt+$total_creditnote_amt;
	$response['Cr. Note/Sale Return(-)']=strval($total_creditnote_amt);
	
	$total_purchase_amt=0;
	$purchase_detail=mysqli_query($con,"SELECT final_net_amt FROM tbl_distributor_transaction where bill_date>='$cdate1' and bill_date<='$cdate2' and txn_type='Add' and distributor_id='$session_dist_ver'");
	while($fetch_purchase = mysqli_fetch_assoc($purchase_detail))
	{
		$total_purchase_amt=$total_purchase_amt+$fetch_purchase['final_net_amt'];
	}
	$total_loss_amt=$total_loss_amt+$total_purchase_amt;
	$response['Purchase(-)']=strval($total_purchase_amt);
	
	$total_debitnote_amt=0;
	$res_debitnote = mysqli_query($con,"SELECT *,sum(final_net_amt) as final_netamt FROM tbl_party_debit_note where distributor_id='$session_dist_ver' and bill_date>='$cdate1' and bill_date<='$cdate2' group by bill_no,unique_bill");
	while($rows_data = mysqli_fetch_assoc($res_debitnote))
	{
		$total_debitnote_amt=$total_debitnote_amt+$rows_data['final_netamt'];
	}
	$total_profit_amt=$total_profit_amt+$total_debitnote_amt;
	$response['Dr. Note/Purchase Return(+)']=strval($total_debitnote_amt);
	
	$total_expenses_amt=0;
	$cash_expense=mysqli_query($con,"SELECT * FROM tbl_distributor_expenses_master where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status in ('Complete','Active')");
	while($rows_data = mysqli_fetch_assoc($cash_expense))
	{
		$total_expenses_amt=$total_expenses_amt+$rows_data['final_amount'];
	}
	$total_loss_amt=$total_loss_amt+$total_expenses_amt;
	$response['Expenses(-)']=strval($total_expenses_amt);
	
	$total_expenses_amt1=0;
	$rescredit1=mysqli_query($con,"select * from tbl_receipt_transaction where status='Complete' and receipt_date>='$cdate1' and receipt_date<='$cdate2' and transaction_id in (SELECT transaction_id FROM tbl_party_transaction where transaction_from in (select user_id from tbl_user where `distributor_id` = '$session_dist_ver'))");
	while($fetch_product_credit=mysqli_fetch_assoc($rescredit1))
	{	
		if($fetch_product_credit['payment_mode']=="Cash" || $fetch_product_credit['payment_mode']=="Cheque" || $fetch_product_credit['payment_mode']=="Online" || $fetch_product_credit['payment_mode']=="Wallet") 
		{
			$total_expenses_amt1=$total_expenses_amt1+$fetch_product_credit['receipt_disc_amt'];
		}
	}
	$total_loss_amt=$total_loss_amt+$total_expenses_amt1;
	$response['Payment In Discount(-)']=strval($total_expenses_amt1);
	$total_other_income_amt=0;
	$res_income = mysqli_query($con,"SELECT * FROM tbl_other_cash_txn_master where distributor_id='$session_dist_ver' and insert_date>='$cdate1' and insert_date<='$cdate2' and status='Complete' and txn_type='Cash Payout'");
	while($rows_data = mysqli_fetch_assoc($res_income))
	{
		$total_other_income_amt=$total_other_income_amt+$rows_data['txn_amount'];
	}
	$total_profit_amt=$total_profit_amt+$total_other_income_amt;
	$response['Other Income(+)']=strval($total_other_income_amt);
	
	$total_gstpay_amt=0;
	$gstp_detail=mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount, tbl_party_transaction_detail.SGST_amount, tbl_party_transaction_detail.IGST_amount from tbl_party_transaction,tbl_party,tbl_party_transaction_detail where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_id = tbl_party_transaction_detail.transaction_id and  tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type!='Receipt'");
	while($rows_data = mysqli_fetch_assoc($gstp_detail))
	{
		$total_gstpay_amt=$total_gstpay_amt+$rows_data['CGST_amount']+$rows_data['SGST_amount']+$rows_data['IGST_amount'];
	}
	$total_loss_amt=$total_loss_amt+round($total_gstpay_amt,2);
	$response['GST_Payable']=strval($total_gstpay_amt);
	
	$total_tcspay_amt=0;
	$gstp_detail=mysqli_query($con,"select tbl_party_transaction.tcs_amount from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and  tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type!='Receipt'");
	while($rows_data = mysqli_fetch_assoc($gstp_detail))
	{
		$total_tcspay_amt=$total_tcspay_amt+$rows_data['tcs_amount'];
	}
	$total_loss_amt=$total_loss_amt+round($total_tcspay_amt,2);
	$response['TCS_Payable']=strval($total_tcspay_amt);
	
	
	$total_gstrec_amt=0;
	$gstr_detail=mysqli_query($con,"SELECT cgst_amt,sgst_amt,igst_amt FROM tbl_distributor_transaction where bill_date>='$cdate1' and bill_date<='$cdate2' and txn_type='Add' and distributor_id='$session_dist_ver'");
	while($rows_data = mysqli_fetch_assoc($gstr_detail))
	{
		$total_gstrec_amt=$total_gstrec_amt+$rows_data['cgst_amt']+$rows_data['sgst_amt']+$rows_data['igst_amt'];
	}
	$total_profit_amt=$total_profit_amt+round($total_gstrec_amt,2);
	$response['GST_Receivable']=strval($total_gstrec_amt);
	
	$total_tcsrec_amt=0;
	$gstr_detail=mysqli_query($con,"SELECT tcs_amt FROM tbl_distributor_transaction_charges where bill_date>='$cdate1' and bill_date<='$cdate2' and distributor_id='$session_dist_ver'");
	while($rows_data = mysqli_fetch_assoc($gstr_detail))
	{
		$total_tcsrec_amt=$total_tcsrec_amt+$rows_data['tcs_amt'];
	}
	$total_profit_amt=$total_profit_amt+round($total_tcsrec_amt,2);
	$response['TCS_Receivable']=strval($total_tcsrec_amt);
	
	$response['profit_amount']=round($total_profit_amt,2);
	$response['loss_amount']=round($total_loss_amt,2);
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing!!";
}	
mysqli_close($con);
echo json_encode($response);
?>